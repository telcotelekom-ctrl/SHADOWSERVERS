export function createSemanticObject(type, payload) {
  return {
    type,
    payload,
    objectId: `obj-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    confidence: 0.92
  };
}

export function attachSemanticContext(object, context) {
  return {
    ...object,
    context: {
      ...(object.context || {}),
      ...context
    }
  };
}

export function serializeSemanticObject(object) {
  return JSON.stringify(object);
}
