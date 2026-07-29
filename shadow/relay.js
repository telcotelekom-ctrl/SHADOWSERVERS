export function chooseRelay(peers) {
  return peers.find((peer) => peer.relay === true) || null;
}
