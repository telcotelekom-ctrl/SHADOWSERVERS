export function createVerylEngine(options = {}) {
  const state = {
    mode: options.mode || 'yield-layer',
    energy: options.energy || 0.7,
    layers: options.layers || ['identity', 'mesh', 'knowledge'],
    lastUpdated: new Date().toISOString()
  };

  return {
    state,
    pulse() {
      state.energy = Math.min(1, state.energy + 0.03);
      state.lastUpdated = new Date().toISOString();
      return state;
    },
    getSnapshot() {
      return { ...state };
    }
  };
}
