export function routeBySemanticIntent(intent, peers) {
  const normalized = `${intent}`.toLowerCase();
  const relayPeers = peers.filter((peer) => peer?.relay);

  if (normalized.includes('trust') || normalized.includes('reputation')) {
    return relayPeers[0] || peers[0] || null;
  }

  if (normalized.includes('state') || normalized.includes('sync')) {
    return peers[0] || null;
  }

  return relayPeers[0] || peers[0] || null;
}

export function buildSemanticRoute(intent, peers) {
  return {
    intent,
    target: routeBySemanticIntent(intent, peers),
    strategy: 'semantic-routing-v1'
  };
}
