export function routePacket(packet, peers) {
  if (!packet || !Array.isArray(peers)) {
    return null;
  }

  const relayPeers = peers.filter((peer) => peer?.relay);
  if (relayPeers.length) {
    return { route: 'relay', target: relayPeers[0] };
  }

  return { route: 'direct', target: peers[0] || null };
}

export function routeEnvelope(envelope, peers) {
  return {
    ...envelope,
    routing: routePacket(envelope, peers)
  };
}
