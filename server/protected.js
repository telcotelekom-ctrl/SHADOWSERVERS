const crypto = require('crypto');
const configStore = require('./config-store');

// Passcode-based access control for the PSY-TEL Hotspot audience.
// Every room (portal user id) has its own access code, stored via
// config-store.js. If an operator hasn't set one yet, that room is simply
// open (no passcode required) - there is no global/shared fallback code,
// so tenants can never guess or reuse each other's codes.
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// token -> { roomId, createdAt }
const activeTokens = new Map();

function createToken(roomId) {
  const token = crypto.randomBytes(24).toString('hex');
  activeTokens.set(token, { roomId, createdAt: Date.now() });
  return token;
}

function purgeExpiredTokens() {
  const now = Date.now();
  for (const [token, meta] of activeTokens.entries()) {
    if (now - meta.createdAt > TOKEN_TTL_MS) {
      activeTokens.delete(token);
    }
  }
}

function verifyPasscode(roomId, candidate) {
  const expectedCode = configStore.getConfig(roomId).accessCode;
  if (!expectedCode) {
    // No access code configured for this room yet -> open access.
    return true;
  }
  if (typeof candidate !== 'string' || !candidate) {
    return false;
  }
  const expected = Buffer.from(expectedCode);
  const provided = Buffer.from(candidate);
  if (expected.length !== provided.length) {
    crypto.timingSafeEqual(Buffer.alloc(expected.length), Buffer.alloc(expected.length));
    return false;
  }
  return crypto.timingSafeEqual(expected, provided);
}

function loginAudience(roomId, passcode) {
  purgeExpiredTokens();
  if (!roomId || !verifyPasscode(roomId, passcode)) {
    return { success: false };
  }
  const token = createToken(roomId);
  return { success: true, token, roomId, expiresInMs: TOKEN_TTL_MS };
}

function isValidAudienceToken(token, roomId) {
  purgeExpiredTokens();
  if (!token) return false;
  const meta = activeTokens.get(token);
  return Boolean(meta && meta.roomId === roomId);
}

function extractToken(req, requestUrl) {
  const header = req.headers['x-psy-tel-token'];
  if (header) return header;
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return requestUrl.searchParams.get('token') || '';
}

module.exports = {
  loginAudience,
  isValidAudienceToken,
  extractToken,
  isRoomOpen: (roomId) => !configStore.getConfig(roomId).accessCode
};

