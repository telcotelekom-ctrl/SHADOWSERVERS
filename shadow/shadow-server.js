// Shadow Server — a real parallel test universe for the Wabenmatrix.
// It never mutates the live core directly. It clones the current state, runs a
// change as a SIMULATION, VALIDATES it (integrity / compatibility / risk),
// optionally EVOLVES it, and only PROMOTES validated results back into the core
// via the ShadowOS merge layer. This is executable — call runProposal() and you
// get a concrete decision + report.

import { mergeStateVectors } from './merge.js';

function deepClone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

// --- Simulation Kernel Layer: apply a proposed change to a cloned state ---
function simulate(baseSnapshot, proposal) {
  const state = deepClone(baseSnapshot);
  const effects = [];

  switch (proposal.op) {
    case 'add-wabe': {
      const wabe = { id: `sim-${state.wabes.length + 1}`, status: 'concept', layer: 1, ...proposal.wabe };
      state.wabes.push(wabe);
      state.wabeCount = state.wabes.length;
      effects.push(`+wabe ${wabe.label} (${wabe.type}) in ${wabe.cluster || 'root'}`);
      break;
    }
    case 'link': {
      const ok = state.wabes.some((w) => w.id === proposal.source) &&
                 state.wabes.some((w) => w.id === proposal.target);
      if (ok) {
        state.relations.push({ source: proposal.source, target: proposal.target, kind: proposal.kind || 'relates' });
        state.relationCount = state.relations.length;
        effects.push(`+relation ${proposal.source} → ${proposal.target}`);
      } else {
        effects.push(`link failed: unknown endpoint`);
      }
      break;
    }
    case 'promote-status': {
      const target = state.wabes.find((w) => w.id === proposal.id);
      if (target) {
        effects.push(`status ${target.status} → ${proposal.status} for ${target.label}`);
        target.status = proposal.status;
      } else {
        effects.push(`promote failed: unknown wabe`);
      }
      break;
    }
    default:
      effects.push(`unknown op: ${proposal.op}`);
  }

  return { state, effects };
}

// --- Validation Layer: integrity, compatibility, risk ---
function validate(baseSnapshot, simState, proposal) {
  const checks = [];

  // Integrity: no orphan relations, unique ids.
  const ids = new Set(simState.wabes.map((w) => w.id));
  const orphanRelations = simState.relations.filter((r) => !ids.has(r.source) || !ids.has(r.target));
  const uniqueIds = ids.size === simState.wabes.length;
  checks.push({ name: 'integrity:no-orphan-relations', pass: orphanRelations.length === 0, detail: `${orphanRelations.length} orphan(s)` });
  checks.push({ name: 'integrity:unique-ids', pass: uniqueIds, detail: uniqueIds ? 'ok' : 'duplicate ids' });

  // Compatibility: existing validated modules must remain present.
  const baseModules = baseSnapshot.wabes.filter((w) => w.type === 'module' && w.status === 'validated').map((w) => w.id);
  const stillPresent = baseModules.every((id) => ids.has(id));
  checks.push({ name: 'compatibility:modules-preserved', pass: stillPresent, detail: stillPresent ? 'nothing overwritten' : 'a module went missing' });

  // Risk: growth ratio of relations vs wabes should stay bounded.
  const growth = (simState.wabeCount + simState.relationCount) - (baseSnapshot.wabeCount + baseSnapshot.relationCount);
  const riskScore = Math.max(0, Math.min(1, growth / 25));
  checks.push({ name: 'risk:bounded-growth', pass: riskScore < 0.8, detail: `risk=${riskScore.toFixed(2)}` });

  const passed = checks.every((c) => c.pass);
  return { passed, riskScore, checks };
}

// --- Evolution Layer: derive an optimization suggestion (non-destructive) ---
function evolve(simState) {
  const concepts = simState.wabes.filter((w) => w.status === 'concept');
  const suggestions = concepts.slice(0, 3).map((w) => ({
    id: w.id,
    suggestion: `promote "${w.label}" concept → in-development after review`
  }));
  return { suggestions, mutationCount: suggestions.length };
}

export function createShadowServer(matrix) {
  const history = [];

  // Run one proposal end-to-end and return a full decision report.
  function runProposal(proposal) {
    const base = matrix.snapshot();
    const { state: simState, effects } = simulate(base, proposal);
    const validation = validate(base, simState, proposal);
    const evolution = evolve(simState);

    const report = {
      at: new Date().toISOString(),
      proposal,
      effects,
      validation,
      evolution,
      decision: validation.passed ? 'promotable' : 'rejected'
    };
    history.push(report);
    return report;
  }

  // Promote a previously-approved proposal into the live core matrix.
  function promote(report) {
    if (!report || report.decision !== 'promotable') {
      return { ok: false, reason: 'proposal not promotable' };
    }
    const p = report.proposal;
    if (p.op === 'add-wabe') {
      const created = matrix.addWabe(p.wabe);
      if (p.linkTo) matrix.link(p.linkTo, created.id, p.kind || 'contains');
      finalizeMerge(report);
      return { ok: true, created: created.id };
    }
    if (p.op === 'link') {
      matrix.link(p.source, p.target, p.kind || 'relates');
      finalizeMerge(report);
      return { ok: true };
    }
    if (p.op === 'promote-status') {
      matrix.setStatus(p.id, p.status, 'promoted from shadow server');
      finalizeMerge(report);
      return { ok: true };
    }
    return { ok: false, reason: 'unknown op' };
  }

  // Bridge to the ShadowOS core: merge the new matrix vector into a fluid update.
  function finalizeMerge(report) {
    const vector = matrix.toVector();
    report.merged = mergeStateVectors({ _v: 0 }, vector);
    return report.merged;
  }

  return {
    runProposal,
    promote,
    history() { return [...history]; }
  };
}
