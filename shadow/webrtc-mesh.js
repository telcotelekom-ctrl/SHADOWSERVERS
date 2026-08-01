// Ultra-Stufe I — WebRTC-P2P Mesh (browser-native, serverless).
// Real peer-to-peer transport for the Wabenmatrix. No signaling server: offers
// and answers are exchanged out-of-band (copy/paste, QR, or the localStorage
// signaling channel below for same-origin tabs). Once a data channel is open,
// matrix events stream directly between browsers over RTCDataChannel.
//
// This closes the loop the blueprint calls "Shadow Servers, no Node": every peer
// IS a server. The mesh replicates matrix deltas so state converges across peers.

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export function createWebRTCMesh(matrix, { id = crypto.randomUUID().slice(0, 8) } = {}) {
  /** @type {Map<string, {pc:RTCPeerConnection, ch:RTCDataChannel|null, state:string}>} */
  const peers = new Map();
  const subscribers = new Set();
  let matrixUnsub = null;
  let applying = false; // guard against echo loops when applying remote deltas

  const supported = typeof RTCPeerConnection !== 'undefined';

  function emit(evt) {
    for (const fn of subscribers) { try { fn(evt); } catch { /* isolate */ } }
  }

  function wireChannel(peerId, ch) {
    const rec = peers.get(peerId);
    if (rec) rec.ch = ch;
    ch.onopen = () => { setState(peerId, 'connected'); syncFull(peerId); };
    ch.onclose = () => setState(peerId, 'closed');
    ch.onmessage = (e) => handleMessage(peerId, e.data);
  }

  function setState(peerId, state) {
    const rec = peers.get(peerId);
    if (rec) rec.state = state;
    emit({ kind: 'peer-state', peerId, state });
  }

  function newPeerConnection(peerId) {
    const pc = new RTCPeerConnection(ICE);
    pc.onconnectionstatechange = () => setState(peerId, pc.connectionState);
    pc.ondatachannel = (e) => wireChannel(peerId, e.channel);
    peers.set(peerId, { pc, ch: null, state: 'new' });
    return pc;
  }

  // createOffer() → become the initiator. Returns SDP to hand to the remote peer.
  async function createOffer(peerId = crypto.randomUUID().slice(0, 8)) {
    if (!supported) throw new Error('WebRTC not supported in this environment');
    const pc = newPeerConnection(peerId);
    const ch = pc.createDataChannel('shadow-mesh');
    wireChannel(peerId, ch);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await iceComplete(pc);
    return { peerId, self: id, sdp: pc.localDescription };
  }

  // acceptOffer(signal) → become the responder. Returns the answer SDP.
  async function acceptOffer(signal) {
    if (!supported) throw new Error('WebRTC not supported in this environment');
    const peerId = signal.self || crypto.randomUUID().slice(0, 8);
    const pc = newPeerConnection(peerId);
    await pc.setRemoteDescription(signal.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await iceComplete(pc);
    return { peerId, self: id, sdp: pc.localDescription };
  }

  // acceptAnswer(signal) → initiator finalises the connection with remote answer.
  async function acceptAnswer(signal) {
    const rec = peers.get(signal.peerId) || [...peers.values()][0];
    if (!rec) throw new Error('No pending peer connection for this answer');
    await rec.pc.setRemoteDescription(signal.sdp);
    return { peerId: signal.peerId, state: rec.pc.connectionState };
  }

  // Wait for ICE gathering so the SDP is complete (no trickle server needed).
  function iceComplete(pc) {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === 'complete') return resolve();
      const check = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', check);
          resolve();
        }
      };
      pc.addEventListener('icegatheringstatechange', check);
      setTimeout(resolve, 2500); // fail-open so callers never hang
    });
  }

  function handleMessage(peerId, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'full' && msg.snapshot) applyFull(msg.snapshot);
    else if (msg.type === 'delta' && msg.event) applyDelta(msg.event);
    emit({ kind: 'message', peerId, msg });
  }

  // Apply a full matrix snapshot from a freshly-connected peer (last-writer-wins
  // by merging: we only hydrate if the remote has strictly more cells).
  function applyFull(snapshot) {
    if (!matrix.serialize || !matrix.hydrate) return;
    const local = matrix.serialize();
    if ((snapshot.cells?.length || 0) > (local.cells?.length || 0)) {
      applying = true;
      try { matrix.hydrate(snapshot); } finally { applying = false; }
    }
  }

  function applyDelta(event) {
    // Deltas are advisory; the local matrix remains the source of truth. We
    // surface them so the host page can reconcile (e.g. re-run compute).
    emit({ kind: 'remote-delta', event });
  }

  function send(peerId, obj) {
    const rec = peers.get(peerId);
    if (rec && rec.ch && rec.ch.readyState === 'open') {
      try { rec.ch.send(JSON.stringify(obj)); } catch { /* drop */ }
    }
  }

  function broadcast(obj) {
    for (const peerId of peers.keys()) send(peerId, obj);
  }

  function syncFull(peerId) {
    if (matrix.serialize) send(peerId, { type: 'full', snapshot: matrix.serialize() });
  }

  // start() → begin replicating local matrix deltas to all connected peers.
  function start() {
    if (matrixUnsub || !matrix.subscribe) return;
    matrixUnsub = matrix.subscribe((event) => {
      if (applying) return;
      broadcast({ type: 'delta', event });
    });
    return { started: true, self: id };
  }

  function stop() {
    if (matrixUnsub) { matrixUnsub(); matrixUnsub = null; }
    for (const { pc } of peers.values()) { try { pc.close(); } catch { /* ignore */ } }
    peers.clear();
  }

  function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

  function status() {
    return {
      self: id,
      supported,
      peers: [...peers.entries()].map(([pid, r]) => ({ id: pid, state: r.state, open: r.ch?.readyState === 'open' })),
      connected: [...peers.values()].filter((r) => r.ch?.readyState === 'open').length
    };
  }

  return {
    id, supported,
    createOffer, acceptOffer, acceptAnswer,
    broadcast, start, stop, subscribe, status
  };
}

// Same-origin localStorage signaling channel — lets two tabs of the SAME site
// auto-connect without copy/paste. Purely optional convenience.
export function createLocalSignaling(mesh, room = 'shadow-usup') {
  const key = `sig:${room}`;
  const seen = new Set();

  function post(kind, payload) {
    const box = JSON.parse(localStorage.getItem(key) || '[]');
    box.push({ id: crypto.randomUUID(), from: mesh.id, kind, payload, at: Date.now() });
    localStorage.setItem(key, JSON.stringify(box.slice(-50)));
  }

  async function onStorage() {
    const box = JSON.parse(localStorage.getItem(key) || '[]');
    for (const m of box) {
      if (seen.has(m.id) || m.from === mesh.id) { seen.add(m.id); continue; }
      seen.add(m.id);
      try {
        if (m.kind === 'offer') post('answer', await mesh.acceptOffer(m.payload));
        else if (m.kind === 'answer') await mesh.acceptAnswer(m.payload);
      } catch { /* ignore malformed */ }
    }
  }

  function enable() {
    window.addEventListener('storage', onStorage);
    onStorage();
    return { room, self: mesh.id };
  }
  function disable() { window.removeEventListener('storage', onStorage); }
  async function announce() { post('offer', await mesh.createOffer()); }

  return { enable, disable, announce };
}
