let peers = [];
let handlers = [];

export function joinNetwork(bootstrap) {
  peers = bootstrap.peers || [];
}

export function onMessage(fn) {
  handlers.push(fn);
}

export function broadcast(payload) {
  peers.forEach((peer) => peer.send?.(payload));
}

export function getPeers() {
  return peers;
}

export function notifyHandlers(payload) {
  handlers.forEach((handler) => handler(payload));
}
