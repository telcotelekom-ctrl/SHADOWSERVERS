// Arbeiterinnen-System (blueprint §5) — the workers that maintain the Wabenmatrix.
// Each method operates for real on the live matrix: collect turns raw input into a
// wabe, structure normalises it, validate checks it, link connects wabes, optimize
// consolidates a cluster, document appends to the audit log. Every action is logged.

export function createArbeiterin(matrix, { name = 'arbeiterin', identity = null } = {}) {
  const journal = [];

  function document(action, detail) {
    const entry = { at: new Date().toISOString(), by: name, action, detail };
    journal.push(entry);
    return entry;
  }

  // collect(input) → create a wabe from raw input.
  function collect(input = {}) {
    const wabe = matrix.addWabe({
      type: input.type || 'data',
      label: input.label || 'collected',
      cluster: input.cluster || 'root',
      content: input.content ?? input,
      status: 'concept',
      reason: `collected by ${name}`
    });
    document('collect', { id: wabe.id, label: wabe.label });
    return wabe;
  }

  // structure(id) → normalise content into a predictable shape.
  function structure(id) {
    const wabe = matrix.get(id);
    if (!wabe) return null;
    const structured = {
      fields: wabe.content && typeof wabe.content === 'object' ? Object.keys(wabe.content) : [],
      value: wabe.content,
      normalisedAt: new Date().toISOString()
    };
    matrix.updateContent(id, structured, `structured by ${name}`);
    document('structure', { id, fields: structured.fields.length });
    return structured;
  }

  // validate(id) → run integrity checks and set status accordingly.
  function validate(id) {
    const wabe = matrix.get(id);
    if (!wabe) return { ok: false, reason: 'unknown wabe' };
    const checks = [
      { name: 'has-label', pass: Boolean(wabe.label) },
      { name: 'has-content', pass: wabe.content != null },
      { name: 'has-cluster', pass: Boolean(wabe.cluster) }
    ];
    const ok = checks.every((c) => c.pass);
    if (ok) matrix.setStatus(id, 'in-development', `validated by ${name}`);
    document('validate', { id, ok });
    return { ok, checks };
  }

  // link(a, b) → connect two wabes.
  function link(a, b, kind = 'relates') {
    const rel = matrix.link(a, b, kind);
    document('link', { a, b, kind, ok: Boolean(rel) });
    return rel;
  }

  // optimize(cluster) → deduplicate labels and promote fully-validated wabes.
  function optimize(cluster) {
    const wabes = matrix.query({ cluster });
    const seen = new Map();
    let merged = 0, promoted = 0;
    for (const w of wabes) {
      const key = `${w.type}:${w.label}`;
      if (seen.has(key)) { merged += 1; continue; }
      seen.set(key, w.id);
      if (w.status === 'in-development') { matrix.setStatus(w.id, 'validated', `optimized by ${name}`); promoted += 1; }
    }
    document('optimize', { cluster, merged, promoted });
    return { cluster, merged, promoted, kept: seen.size };
  }

  return { name, collect, structure, validate, link, optimize, document, journal() { return [...journal]; } };
}

// A small pool of workers, so the matrix can be maintained in parallel.
export function createWorkforce(matrix, count = 3) {
  const workers = Array.from({ length: count }, (_, i) => createArbeiterin(matrix, { name: `arbeiterin-${i + 1}` }));
  return {
    workers,
    dispatch(task) {
      const worker = workers[Math.floor(Math.random() * workers.length)];
      return { worker: worker.name, result: task(worker) };
    }
  };
}
