function getStorage() {
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  if (!globalThis.__shadowStorage) {
    globalThis.__shadowStorage = {};
  }
  return globalThis.__shadowStorage;
}

export function analyzeState(state) {
  const signals = [];
  const summaryParts = [];

  if (state?.identity) {
    signals.push('identity-registered');
    summaryParts.push('Identity is present');
  }

  if (state?.ready) {
    signals.push('kernel-ready');
    summaryParts.push('Kernel is operational');
  }

  if (state?.bootedAt) {
    signals.push('booted');
  }

  if (state?.lastInsight) {
    signals.push('insight-available');
  }

  const insight = {
    id: `insight-${Date.now()}`,
    summary: summaryParts.join(' · ') || 'Shadow kernel awaiting context',
    signals,
    score: signals.length,
    recommendations: [
      'Keep the relay fabric active',
      'Propagate semantic objects across the mesh',
      'Preserve protocol envelopes for resilient sync'
    ]
  };

  const storage = getStorage();
  storage['__shadow_ai_last_insight'] = JSON.stringify(insight);
  return insight;
}

export function generateInsight(state) {
  return analyzeState(state);
}
