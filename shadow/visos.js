export function createVisosEngine(options = {}) {
  const state = {
    mode: options.mode || 'adaptive',
    spheres: options.spheres || 3,
    resonance: options.resonance || 0.8,
    lastUpdated: new Date().toISOString()
  };

  return {
    state,
    evolve() {
      state.resonance = Math.min(1, state.resonance + 0.05);
      state.lastUpdated = new Date().toISOString();
      return state;
    },
    getSnapshot() {
      return { ...state };
    }
  };
}
