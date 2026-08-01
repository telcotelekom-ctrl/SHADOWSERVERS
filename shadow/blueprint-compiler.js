// Blueprint Compiler — collapses the whole living system into ONE portable JSON
// blueprint: physical geometry + logic registry + evolution history + matrix
// snapshot. This is the exportable "seed" of the entire universe.
import { exportPhysicalShape } from './physical-shaping.js';
import { listLogic } from './wabe-logic.js';

// compileBlueprint(system) → a single self-describing structure.
export function compileBlueprint(system = {}) {
  const matrix = system.matrix;
  let evolution = [];
  try {
    // Evolution journal exists only if the daemon was started.
    const daemon = typeof system.evolution === 'function' ? system.evolution() : null;
    if (daemon && typeof daemon.journal === 'function') evolution = daemon.journal();
  } catch { /* daemon not available — leave empty */ }

  return {
    compiledAt: new Date().toISOString(),
    code: system.code || 'USUP',
    geometry: matrix ? exportPhysicalShape(matrix) : [],
    logic: listLogic().map((l) => ({ key: l.key, cluster: l.cluster, synthesized: !!l.synthesized })),
    matrix: matrix && matrix.serialize ? matrix.serialize() : null,
    evolution
  };
}

// toJSON(system) → the blueprint as a downloadable JSON string.
export function blueprintToJSON(system, pretty = true) {
  return JSON.stringify(compileBlueprint(system), null, pretty ? 2 : 0);
}
