import { applyChange, createState } from './state.js';
import { savePeerState, loadPeerState } from './peer-persistence.js';

export function createSyncSession(name = 'default') {
  return {
    id: `sync-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    createdAt: new Date().toISOString(),
    state: createState({ session: name })
  };
}

export function applySyncDelta(session, delta) {
  const nextState = applyChange(session.state, delta);
  session.state = nextState;
  savePeerState(session.id, nextState);
  return nextState;
}

export function restoreSyncSession(sessionId) {
  return loadPeerState(sessionId);
}

export function broadcastSync(session, payload) {
  return {
    sessionId: session.id,
    payload,
    broadcastAt: new Date().toISOString()
  };
}
