export async function openChannel(peer) {
  try {
    return await openWebRTC(peer);
  } catch (error) {
    return await openWebSocket(peer);
  }
}

async function openWebRTC(peer) {
  if (typeof peer?.openWebRTC === 'function') {
    return peer.openWebRTC();
  }
  throw new Error('WebRTC unavailable');
}

async function openWebSocket(peer) {
  if (typeof peer?.openWebSocket === 'function') {
    return peer.openWebSocket();
  }
  return { mode: 'fallback', peer };
}
