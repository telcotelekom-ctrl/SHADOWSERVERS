// Spotify integration for the PSY-TEL Hotspot Studio.
// Uses the Client Credentials flow (app-only auth, no user login needed) to
// search tracks and match them against the transposer's current musical key
// using Spotify's audio-features (pitch class + mode) data.
//
// Each operator (room) supplies their own Client ID / Secret via the studio
// setup form (see config-store.js) - credentials are passed in explicitly
// rather than read from process.env so multiple tenants can each use their
// own Spotify app without any cross-tenant leakage.

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };

// clientId -> { value, expiresAt }
const tokenCache = new Map();

function isConfigured(credentials) {
  return Boolean(credentials && credentials.clientId && credentials.clientSecret);
}

function parseKeyName(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') return null;
  const match = rawKey.trim().match(/^([A-G])(#|b)?(m)?/);
  if (!match) return null;
  let note = match[1] + (match[2] || '');
  if (FLAT_TO_SHARP[note]) note = FLAT_TO_SHARP[note];
  const pitchClass = NOTES_SHARP.indexOf(note);
  if (pitchClass === -1) return null;
  const mode = match[3] === 'm' ? 0 : 1; // Spotify: 1 = major, 0 = minor
  return { pitchClass, mode };
}

async function getAccessToken(credentials) {
  const cached = tokenCache.get(credentials.clientId);
  if (cached && cached.expiresAt > Date.now() + 5000) {
    return cached.value;
  }

  const basic = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status}`);
  }

  const data = await response.json();
  const entry = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000
  };
  tokenCache.set(credentials.clientId, entry);
  return entry.value;
}


async function searchTracks(token, query, limit) {
  const url = new URL('https://api.spotify.com/v1/search');
  url.searchParams.set('q', query);
  url.searchParams.set('type', 'track');
  url.searchParams.set('limit', String(Math.min(limit, 50)));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.status}`);
  }
  const data = await response.json();
  return (data.tracks && data.tracks.items) || [];
}

async function getAudioFeatures(token, trackIds) {
  if (!trackIds.length) return [];
  const url = new URL('https://api.spotify.com/v1/audio-features');
  url.searchParams.set('ids', trackIds.join(','));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error(`Spotify audio-features failed: ${response.status}`);
  }
  const data = await response.json();
  return (data.audio_features || []).filter(Boolean);
}

async function matchTracksByKey({ keyName, query, limit }) {
  if (!isConfigured()) {
    return {
      configured: false,
      message: 'Spotify ist nicht konfiguriert. Setze SPOTIFY_CLIENT_ID und SPOTIFY_CLIENT_SECRET als Umgebungsvariablen.'
    };
  }

  const parsedKey = parseKeyName(keyName);
  if (!parsedKey) {
    return { configured: true, error: `Ungültige Tonart: ${keyName}` };
  }

  const token = await getAccessToken();
  const searchQuery = query && query.trim() ? query.trim() : 'top hits';
  const candidates = await searchTracks(token, searchQuery, Math.max(limit || 20, 20));

  const trackIds = candidates.map((track) => track.id).filter(Boolean);
  const features = await getAudioFeatures(token, trackIds);
  const featuresById = new Map(features.map((feature) => [feature.id, feature]));

  const matches = candidates
    .filter((track) => {
      const feature = featuresById.get(track.id);
      return feature && feature.key === parsedKey.pitchClass && feature.mode === parsedKey.mode;
    })
    .slice(0, limit || 10)
    .map((track) => {
      const feature = featuresById.get(track.id);
      return {
        name: track.name,
        artists: track.artists.map((artist) => artist.name).join(', '),
        url: track.external_urls && track.external_urls.spotify,
        previewUrl: track.preview_url,
        tempo: Math.round(feature.tempo)
      };
    });

  return {
    configured: true,
    key: keyName,
    query: searchQuery,
    matchCount: matches.length,
    matches
  };
}

module.exports = { matchTracksByKey, parseKeyName, isConfigured };
