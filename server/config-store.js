const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Encrypted local storage for PSY-TEL Hotspot Studio credentials.
// Every portal account (see users.json / sessions.json) is its own "room"
// with fully isolated SMTP / Spotify / audience-access-code settings, so
// multiple independent operators can run their own hotspot without ever
// sharing or overwriting each other's credentials.
//
// Each room's config lives in its own encrypted file, keyed by userId:
//   server/data/hotspot-configs/<userId>.enc.json
// The setup form in the studio UI (gated behind the operator's portal
// login) persists values here and they apply instantly - no .env editing,
// no restart, no cross-tenant leakage.

const dataDir = path.join(__dirname, 'data');
const keyFile = path.join(dataDir, '.secret-key');
const configsDir = path.join(dataDir, 'hotspot-configs');
const legacyStoreFile = path.join(dataDir, 'hotspot-config.enc.json');

const FIELDS = [
  'accessCode',
  'smtpHost',
  'smtpPort',
  'smtpUser',
  'smtpPass',
  'smtpFrom',
  'smtpTo',
  'spotifyClientId',
  'spotifyClientSecret'
];

function emptyConfig() {
  return FIELDS.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
}

function ensureDataDir() {
  fs.mkdirSync(configsDir, { recursive: true });
}

function ensureEncryptionKey() {
  ensureDataDir();
  if (fs.existsSync(keyFile)) {
    return Buffer.from(fs.readFileSync(keyFile, 'utf8'), 'base64');
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(keyFile, key.toString('base64'), { mode: 0o600 });
  return key;
}

function encryptObject(obj, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(obj), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    data: ciphertext.toString('base64')
  };
}

function decryptObject(payload, key) {
  const iv = Buffer.from(payload.iv, 'base64');
  const authTag = Buffer.from(payload.authTag, 'base64');
  const ciphertext = Buffer.from(payload.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
}

function safeRoomId(roomId) {
  // Defensive: only allow the characters our own userIds use, to keep the
  // filename strictly inside configsDir (no path traversal).
  const clean = String(roomId || '').replace(/[^a-zA-Z0-9_-]/g, '');
  if (!clean) {
    throw new Error('Invalid room id');
  }
  return clean;
}

function roomFile(roomId) {
  return path.join(configsDir, `${safeRoomId(roomId)}.enc.json`);
}

function readRoomFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    const key = ensureEncryptionKey();
    const payload = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return decryptObject(payload, key);
  } catch (error) {
    return null;
  }
}

function writeRoomFile(filePath, config) {
  const key = ensureEncryptionKey();
  const payload = encryptObject(config, key);
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(payload), { mode: 0o600 });
}

// One-time migration: the very first single-tenant version of this feature
// stored one shared config for the whole server. If that legacy file still
// exists and this room has nothing of its own yet, adopt it once so the
// original operator does not lose their already-configured setup.
function migrateLegacyIfNeeded(roomId, filePath) {
  if (fs.existsSync(filePath) || !fs.existsSync(legacyStoreFile)) {
    return null;
  }
  const legacy = readRoomFile(legacyStoreFile);
  if (!legacy) {
    return null;
  }
  const merged = { ...emptyConfig(), ...legacy };
  writeRoomFile(filePath, merged);
  return merged;
}

// Returns the decrypted config for a given room (portal user id).
// Unconfigured fields come back as empty strings - there is no fallback to
// other rooms or to global env vars, so tenants never inherit each other's
// credentials.
function getConfig(roomId) {
  const filePath = roomFile(roomId);
  const migrated = migrateLegacyIfNeeded(roomId, filePath);
  const stored = migrated || readRoomFile(filePath) || {};
  return { ...emptyConfig(), ...stored };
}

// Merges the given partial config into this room's encrypted store and
// persists it. Returns the full resulting config and the list of fields
// that were actually updated (non-empty strings only).
function saveConfig(roomId, partialConfig) {
  const filePath = roomFile(roomId);
  const existing = getConfig(roomId);
  const applied = [];
  const merged = { ...existing };
  for (const field of FIELDS) {
    const value = partialConfig ? partialConfig[field] : undefined;
    if (typeof value === 'string') {
      merged[field] = value.trim();
      if (merged[field] !== '') {
        applied.push(field);
      }
    }
  }
  writeRoomFile(filePath, merged);
  return { config: merged, applied };
}

function getStatus(roomId) {
  const config = getConfig(roomId);
  return {
    smtpConfigured: Boolean(config.smtpHost && config.smtpUser && config.smtpPass),
    spotifyConfigured: Boolean(config.spotifyClientId && config.spotifyClientSecret),
    accessCodeConfigured: Boolean(config.accessCode)
  };
}

module.exports = { getConfig, saveConfig, getStatus, FIELDS };
