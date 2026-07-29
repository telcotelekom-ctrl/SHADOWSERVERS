import * as identity from './identity.js';
import * as state from './state.js';
import * as mesh from './mesh.js';
import { startShadowKernelWasm } from './kernel-wasm.js';
import * as relay from './relay.js';
import * as transport from './transport.js';
import * as discovery from './discovery.js';
import * as crypto from './crypto.js';
import * as scheduler from './scheduler.js';
import * as storage from './storage.js';
import * as ai from './ai.js';
import * as semantic from './semantic.js';
import * as fabric from './fabric.js';
import * as protocol from './protocol.js';
import * as discoveryFabric from './discovery-fabric.js';
import * as routing from './routing.js';
import * as trust from './trust.js';
import * as peerPersistence from './peer-persistence.js';
import * as sync from './sync.js';
import * as broadcast from './broadcast.js';
import * as trustGraph from './trust-graph.js';
import * as semanticRouting from './semantic-routing.js';
import * as merge from './merge.js';
import * as observability from './observability.js';

export async function startShadowOS() {
  const adaptiveBootstrap = startShadowKernelWasm({ adapter: 'browser', identityId: 'shadow-portal-self' });
  const identityRecord = await identity.createIdentity();
  const identityPub = identityRecord.pub;
  const peers = discovery.discover();
  const discoveredPeers = discoveryFabric.discoverFabricPeers();
  const registeredPeers = discoveredPeers.map((peer) => ({ ...peer, discoveredAt: new Date().toISOString() }));
  discoveryFabric.registerDiscoveryPeer({ id: 'self', relay: true, kind: 'local' });
  mesh.joinNetwork({ peers: [...peers, ...registeredPeers] });

  const initialState = state.createState({ identity: identityPub, ready: true });
  const stateRef = state.applyChange(initialState, { bootedAt: new Date().toISOString() });
  await storage.save('shadow-state', stateRef);
  peerPersistence.syncPeerState('root', stateRef);

  const semanticObject = semantic.attachSemanticContext(
    semantic.createSemanticObject('kernel', { mode: 'shadow-os', version: '1.0.0' }),
    { owner: 'raymond', layer: 'kernel' }
  );

  const relayFabric = fabric.createRelayFabric({
    nodes: [{ id: 'relay-local', relay: true }, { id: 'relay-edge', relay: false }]
  });

  const syncSession = sync.createSyncSession('shadow-kernel');
  const syncBroadcast = broadcast.createBroadcastMesh();
  const sessionDelta = sync.applySyncDelta(syncSession, { lastMode: 'shadow-os', lastBoot: new Date().toISOString() });
  const sessionEnvelope = sync.broadcastSync(syncSession, { state: sessionDelta, relayFabric });
  const trustGraphInstance = trustGraph.createTrustGraph();
  trustGraphInstance.addNode('self', 0.95);
  trustGraphInstance.addNode('bootstrap-local', 0.7);
  trustGraphInstance.addEdge('self', 'bootstrap-local', 0.3);
  const semanticRoute = semanticRouting.buildSemanticRoute('trust and state sync', registeredPeers);
  const observer = observability.createObserver();
  observer.record({ type: 'kernel-start', detail: 'shadow-os booted' });
  const mergedState = merge.mergeStateVectors(stateRef, sessionDelta);

  const inbox = protocol.wrapInProtocol({
    semanticObject,
    insight: ai.generateInsight(stateRef),
    relayFabric,
    discovery: registeredPeers,
    routing: routing.routeEnvelope({ type: 'state-sync', state: stateRef }, registeredPeers),
    sync: sessionEnvelope,
    broadcast: syncBroadcast.publish({ type: 'peer-broadcast', session: syncSession.id, state: sessionDelta }),
    trustGraph: {
      nodes: Array.from(trustGraphInstance.listEdges().length ? [{ id: 'self', score: 0.95 }, { id: 'bootstrap-local', score: 0.7 }] : []),
      edges: trustGraphInstance.listEdges(),
      trustScore: trustGraphInstance.getTrustScore('self')
    },
    semanticRoute,
    mergeResult: mergedState,
    observability: observer.list()
  }, { source: 'kernel', scope: 'shadow' });

  const signedEnvelope = await trust.signEnvelope(
    inbox,
    await globalThis.crypto.subtle.importKey(
      'jwk',
      identityRecord.priv,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    )
  );

  scheduler.schedule(() => {
    mesh.notifyHandlers({ type: 'shadow-os-ready', state: stateRef, payload: signedEnvelope });
  });

  return {
    identityPub,
    state: stateRef,
    peers,
    semanticObject,
    inbox: signedEnvelope,
    runtime: adaptiveBootstrap,
    protocol: adaptiveBootstrap.protocol?.getSnapshot?.() || null
  };
}

export function createShadowKernelApi() {
  return {
    identity,
    state,
    mesh,
    relay,
    transport,
    discovery,
    crypto,
    scheduler,
    storage,
    ai,
    semantic,
    fabric,
    protocol
  };
}
