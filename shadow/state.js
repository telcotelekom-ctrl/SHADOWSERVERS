export function createState(initial = {}) {
  return { ...initial, _v: 0 };
}

export function applyChange(state, change) {
  Object.assign(state, change);
  state._v += 1;
  return state;
}

export function merge(local, remote) {
  return remote._v > local._v ? remote : local;
}
