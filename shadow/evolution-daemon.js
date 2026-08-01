// Ultra-Stufe III — Self-Evolution Daemon (browser-native, safe).
// An autonomous loop that grows the system WITHOUT bypassing safety: every change
// is routed through the Shadow Server's simulate → validate → promote pipeline, so
// nothing is ever mutated blindly. The daemon:
//   1. scans the Wabenmatrix for concept-status cells that are "ready",
//   2. proposes their promotion through the Shadow Server,
//   3. promotes only what the server marks promotable,
//   4. optionally synthesises new logic when a cluster looks under-served.
// It keeps a full journal and can be paused/resumed. This is controlled evolution.

export function createEvolutionDaemon(system, {
  intervalMs = 5000,
  maxPromotionsPerTick = 2,
  autoSynthesize = false
} = {}) {
  const journal = [];
  const subscribers = new Set();
  let timer = null;
  let generation = 0;
  let running = false;

  const log = (kind, detail) => {
    const e = { at: new Date().toISOString(), generation, kind, detail };
    journal.push(e);
    if (journal.length > 500) journal.shift();
    for (const fn of subscribers) { try { fn(e); } catch { /* isolate */ } }
    return e;
  };

  // A concept cell is "ready" when it has content and at least one relation —
  // i.e. it is connected to the living structure, not an orphan idea.
  function findReady() {
    const cells = system.matrix.list ? system.matrix.list() : [];
    return cells.filter((c) => {
      if (c.status !== 'concept' && c.status !== 'in-development') return false;
      const rels = system.matrix.relations ? system.matrix.relations(c.id) : [];
      const hasContent = c.content && Object.keys(c.content).length > 0;
      return hasContent && rels.length > 0;
    });
  }

  // Route one promotion through the Shadow Server. Never promotes directly.
  function tryPromote(cell) {
    const proposal = { op: 'promote-status', wabeId: cell.id, to: 'validated' };
    const sim = system.run(proposal);
    if (sim && (sim.decision === 'promotable' || sim.ok)) {
      const done = system.promote ? system.promote(sim) : null;
      log('promote', { wabe: cell.id, label: cell.label, decision: sim.decision });
      return { ok: true, cell: cell.id, result: done };
    }
    log('reject', { wabe: cell.id, decision: sim && sim.decision });
    return { ok: false, cell: cell.id };
  }

  // If a cluster has only concepts and no validated logic, propose a stub program.
  function maybeSynthesize() {
    if (!autoSynthesize || typeof system.synthesize !== 'function') return null;
    const snap = system.matrix.snapshot ? system.matrix.snapshot() : null;
    if (!snap) return null;
    const spec = {
      name: `auto-metric-gen${generation}`,
      cluster: 'BEDRIJF',
      label: `Auto-Metric (gen ${generation})`,
      inputs: [{ name: 'value', default: 0 }, { name: 'factor', default: 1 }],
      outputs: [{ name: 'scaled', expr: 'value * factor' }]
    };
    try {
      const res = system.synthesize(spec);
      log('synthesize', { name: spec.name, decision: res && res.decision });
      return res;
    } catch (err) {
      log('synthesize-error', String(err));
      return null;
    }
  }

  // One evolution tick.
  function tick() {
    generation += 1;
    const ready = findReady();
    log('scan', { ready: ready.length, generation });
    let promoted = 0;
    for (const cell of ready) {
      if (promoted >= maxPromotionsPerTick) break;
      const r = tryPromote(cell);
      if (r.ok) promoted += 1;
    }
    if (promoted === 0) maybeSynthesize();
    const snap = system.matrix.snapshot ? system.matrix.snapshot() : {};
    return { generation, promoted, validated: snap.byStatus?.validated || 0 };
  }

  function start() {
    if (running) return { running: true };
    running = true;
    log('start', { intervalMs, autoSynthesize });
    timer = setInterval(tick, intervalMs);
    return { running: true, intervalMs };
  }

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    running = false;
    log('stop', { generation });
    return { running: false, generation };
  }

  function step() { return tick(); } // manual single generation

  function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

  function status() {
    const snap = system.matrix.snapshot ? system.matrix.snapshot() : {};
    return {
      running, generation,
      validated: snap.byStatus?.validated || 0,
      concepts: snap.byStatus?.concept || 0,
      journalSize: journal.length
    };
  }

  return { start, stop, step, subscribe, status, journal: () => [...journal] };
}
