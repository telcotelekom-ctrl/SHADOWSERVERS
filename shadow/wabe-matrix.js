// Wabenmatrix — the cellular data core of the ShadowOS universe.
// Every unit of the system (data, code, concept, process, module/app) is a "wabe":
// a cell with a type, content, relations, status and an append-only log.
// This is real, executable state — not a description. The VOS renders it and the
// Shadow Server simulates changes against it.

const WABE_TYPES = ['data', 'code', 'concept', 'process', 'module'];
const WABE_STATUSES = ['concept', 'in-development', 'validated', 'historical'];

let counter = 0;
function nextId(prefix = 'wabe') {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function createWabeMatrix(seed = {}) {
  /** @type {Map<string, object>} */
  const cells = new Map();
  /** @type {Array<{source:string,target:string,kind:string}>} */
  const relations = [];
  const listeners = new Set();

  function emit(event) {
    for (const fn of listeners) {
      try { fn(event); } catch { /* isolate listener errors */ }
    }
  }

  function addWabe(input = {}) {
    const type = WABE_TYPES.includes(input.type) ? input.type : 'concept';
    const wabe = {
      id: input.id || nextId(),
      type,
      label: input.label || type,
      cluster: input.cluster || 'root',
      content: input.content ?? null,
      status: WABE_STATUSES.includes(input.status) ? input.status : 'concept',
      layer: Number.isFinite(input.layer) ? input.layer : 1,
      createdAt: new Date().toISOString(),
      log: []
    };
    logEntry(wabe, 'created', input.reason || 'wabe created');
    cells.set(wabe.id, wabe);
    emit({ kind: 'wabe:add', id: wabe.id });
    return wabe;
  }

  function logEntry(wabe, action, reason, actor = 'system') {
    wabe.log.push({ at: new Date().toISOString(), action, reason, actor });
    return wabe;
  }

  function link(sourceId, targetId, kind = 'relates') {
    if (!cells.has(sourceId) || !cells.has(targetId)) return null;
    const relation = { source: sourceId, target: targetId, kind };
    relations.push(relation);
    logEntry(cells.get(sourceId), 'link', `→ ${targetId} (${kind})`);
    emit({ kind: 'wabe:link', relation });
    return relation;
  }

  function setStatus(id, status, reason = 'status change', actor = 'system') {
    const wabe = cells.get(id);
    if (!wabe || !WABE_STATUSES.includes(status)) return null;
    wabe.status = status;
    logEntry(wabe, 'status', `${status} — ${reason}`, actor);
    emit({ kind: 'wabe:status', id, status });
    return wabe;
  }

  function updateContent(id, content, reason = 'content update', actor = 'system') {
    const wabe = cells.get(id);
    if (!wabe) return null;
    wabe.content = content;
    logEntry(wabe, 'update', reason, actor);
    emit({ kind: 'wabe:update', id });
    return wabe;
  }

  // A cluster = the wabe-cluster an existing application maps to (e.g. INTERACTIE).
  function ensureCluster(name, apps = []) {
    const clusterWabe = addWabe({ type: 'module', label: name, cluster: name, status: 'validated' });
    for (const app of apps) {
      const appWabe = addWabe({ type: 'module', label: app, cluster: name, status: 'validated' });
      link(clusterWabe.id, appWabe.id, 'contains');
    }
    return clusterWabe;
  }

  function query({ type, cluster, status } = {}) {
    return [...cells.values()].filter((w) =>
      (!type || w.type === type) &&
      (!cluster || w.cluster === cluster) &&
      (!status || w.status === status)
    );
  }

  function snapshot() {
    return {
      wabeCount: cells.size,
      relationCount: relations.length,
      clusters: [...new Set([...cells.values()].map((w) => w.cluster))],
      byStatus: WABE_STATUSES.reduce((acc, s) => {
        acc[s] = [...cells.values()].filter((w) => w.status === s).length;
        return acc;
      }, {}),
      wabes: [...cells.values()].map((w) => ({
        id: w.id, type: w.type, label: w.label, cluster: w.cluster, status: w.status, layer: w.layer
      })),
      relations: [...relations]
    };
  }

  function toVector() {
    // Compact state vector for merge/sync with the ShadowOS core.
    return {
      _matrix: snapshot(),
      _v: cells.size + relations.length
    };
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  // Full state export (incl. content + log) for durable persistence.
  function serialize() {
    return { cells: [...cells.values()], relations: [...relations], counter };
  }

  // Rebuild the matrix from a serialize() payload (used on restore from IndexedDB).
  function hydrate(data) {
    if (!data || !Array.isArray(data.cells)) return { ok: false, reason: 'no data' };
    cells.clear();
    relations.length = 0;
    for (const c of data.cells) cells.set(c.id, c);
    for (const r of data.relations || []) relations.push(r);
    if (Number.isFinite(data.counter)) counter = Math.max(counter, data.counter);
    emit({ kind: 'matrix:hydrate', count: cells.size });
    return { ok: true, count: cells.size };
  }

  // Seed the existing application suite as wabe-clusters. Nothing is overwritten —
  // each existing program becomes a validated module wabe. Skipped when restoring.
  if (!seed.restore) {
    const defaultClusters = seed.clusters || {
      INTERACTIE: ['Spidermouse'],
      BEDRIJF: ['Business Suite', 'Business Process Manager'],
      HR: ['Sollicitatieportaal', 'HR Intake Engine'],
      INVESTERING: ['Investor Calculator', 'Investment Scenario Engine'],
      PARTICIPATIE: ['Financiële Bedelingen', 'Financial Distribution Engine'],
      FISCAAL: ['Fiscale Calculator', 'Fiscal Logic Core'],
      REGISTRATIE: ['Formal Registry', 'Registry Validator', 'Participation Engine']
    };
    for (const [name, apps] of Object.entries(defaultClusters)) {
      ensureCluster(name, apps);
    }
  } else {
    hydrate(seed.restore);
  }

  return {
    WABE_TYPES,
    WABE_STATUSES,
    addWabe,
    link,
    setStatus,
    updateContent,
    ensureCluster,
    query,
    get(id) { return cells.get(id) || null; },
    list() { return [...cells.values()]; },
    relations() { return [...relations]; },
    snapshot,
    serialize,
    hydrate,
    toVector,
    subscribe
  };
}
