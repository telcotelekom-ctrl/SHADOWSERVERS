export function mergeStateVectors(localState, remoteState) {
  const merged = { ...localState, ...remoteState };
  merged._v = Math.max(localState?._v || 0, remoteState?._v || 0) + 1;
  return merged;
}

export function mergePeerStates(states) {
  return states.reduce((acc, current) => mergeStateVectors(acc, current), {});
}
