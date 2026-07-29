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
