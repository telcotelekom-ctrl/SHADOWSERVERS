export function createShadowProtocolOmega(options = {}) {
  const runtime = options.runtime || {};
  const identity = {
    id: options.identityId || 'shadow-portal-self',
    kind: 'shadow-protocol',
    version: 'Ω∞',
    runtime: runtime.adapter || 'browser',
    capabilities: runtime.capabilities || []
  };

  return {
    identity,
    discover() {
      return {
        protocol: 'Shadow Protocol Ω∞',
        runtime: runtime.adapter || 'browser',
        discoveredAt: new Date().toISOString()
      };
    },
    createSession(label = 'portal') {
      return {
        id: `session-${Date.now()}`,
        label,
        protocol: 'Shadow Protocol Ω∞',
        createdAt: new Date().toISOString()
      };
    },
    createEnvelope(payload, metadata = {}) {
      return {
        protocol: 'Shadow Protocol Ω∞',
        identity,
        payload,
        metadata,
        timestamp: new Date().toISOString()
      };
    },
    sync(state, delta = {}) {
      return {
        state,
        delta,
        protocol: 'Shadow Protocol Ω∞',
        syncedAt: new Date().toISOString()
      };
    },
    relay(message, route = {}) {
      return {
        route,
        message,
        protocol: 'Shadow Protocol Ω∞',
        relayedAt: new Date().toISOString()
      };
    },
    createKnowledgeNode(label, payload = {}) {
      return {
        id: `knowledge-${Date.now()}`,
        label,
        payload,
        protocol: 'Shadow Protocol Ω∞'
      };
    },
    createEvent(type, detail = {}) {
      return {
        type,
        detail,
        protocol: 'Shadow Protocol Ω∞',
        emittedAt: new Date().toISOString()
      };
    },
    createObject(kind, payload = {}) {
      return {
        kind,
        payload,
        protocol: 'Shadow Protocol Ω∞',
        createdAt: new Date().toISOString()
      };
    },
    getSnapshot() {
      return {
        protocol: 'Shadow Protocol Ω∞',
        identity,
        runtime: runtime.adapter || 'browser'
      };
    }
  };
}

export function createProtocolEnvelope(type, payload, metadata = {}) {
  return {
    protocol: 'shadow-os-v1',
    type,
    payload,
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...metadata
    }
  };
}

export function wrapInProtocol(payload, metadata = {}) {
  return createProtocolEnvelope('payload', payload, metadata);
}
