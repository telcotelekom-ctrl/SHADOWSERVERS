function getStorage() {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  if (!globalThis.__shadowPeerPersistenceStorage) {
    globalThis.__shadowPeerPersistenceStorage = {};
  }
  return globalThis.__shadowPeerPersistenceStorage;
}

export function savePeerState(key, state) {
  const storage = getStorage();
  storage[`__shadow_peer_state_${key}`] = JSON.stringify(state);
  return state;
}

export function loadPeerState(key) {
  const storage = getStorage();
  const raw = storage[`__shadow_peer_state_${key}`];
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function syncPeerState(key, state) {
  const persisted = savePeerState(key, state);
  return { persisted, syncedAt: new Date().toISOString() };
}
