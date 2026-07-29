const DEFAULT_DISCOVERY = [
  { id: 'bootstrap-local', relay: true, kind: 'bootstrap' },
  { id: 'bootstrap-edge', relay: false, kind: 'peer' }
];

function getStorage() {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  if (!globalThis.__shadowDiscoveryStorage) {
    globalThis.__shadowDiscoveryStorage = {};
  }
  return globalThis.__shadowDiscoveryStorage;
}

export function discoverFabricPeers() {
  const storage = getStorage();
  const saved = storage.__shadow_discovery_peers;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      // ignore malformed storage
    }
  }
  return DEFAULT_DISCOVERY;
}

export function registerDiscoveryPeer(peer) {
  const storage = getStorage();
  const peers = discoverFabricPeers();
  const next = peers.some((entry) => entry.id === peer.id) ? peers : [...peers, peer];
  storage.__shadow_discovery_peers = JSON.stringify(next);
  return next;
}
