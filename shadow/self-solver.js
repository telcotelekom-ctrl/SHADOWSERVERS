// Self-Organizing Problem Solver — plugs into the existing program-synthesis
// pipeline. A "problem" is described declaratively (name + inputs + output
// formulas); the solver turns it into REAL executable logic via specToLogic (the
// same safe, no-eval parser used by Stufe V) and runs it. If a live system is
// given, it can also deploy the solution through the Shadow Server.
import { specToLogic } from './program-synthesis.js';

// Normalise a loose problem description into a synthesis spec.
function toSpec(problem = {}) {
  if (problem.outputs && Array.isArray(problem.outputs)) return problem; // already a spec
  // Minimal fallback: echo each numeric input through an identity output.
  const inputs = problem.inputs || [];
  return {
    name: problem.name || 'auto-solution',
    cluster: problem.cluster || 'BEDRIJF',
    label: problem.label || problem.name || 'Auto-Solution',
    inputs,
    outputs: (problem.outputs) || inputs.map((i) => ({ name: `${i.name}_out`, expr: i.name }))
  };
}

export function createSelfSolver(system = {}) {
  // solve(problem) → build logic from the problem and run it locally.
  function solve(problem = {}) {
    const spec = toSpec(problem);
    const logic = specToLogic(spec);
    const result = logic.run(problem.input || {});
    return { spec: spec.name, cluster: spec.cluster, result };
  }

  // deploy(problem) → build + validate + promote through the live system.
  function deploy(problem = {}) {
    if (typeof system.deploySynthesized !== 'function') {
      throw new Error('Solver needs a live system with deploySynthesized() to deploy');
    }
    const spec = toSpec(problem);
    return system.deploySynthesized(spec, problem.input || {});
  }

  return { solve, deploy };
}
