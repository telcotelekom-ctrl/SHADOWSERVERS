// Quantum Fluid Layer (blueprint §6) — the transport layer for all data streams
// and updates. It carries module updates with priorities, keeps a version history
// per module and supports rollback. "Quantum/parallel" = multiple streams handled
// via microtask scheduling. This is a real, working message/version bus.

export function createQuantumFluid() {
  /** @type {Map<string, Array<{version:number, payload:any, at:string}>>} */
  const versions = new Map();
  /** @type {Array<{id:string, priority:number, run:Function}>} */
  const queue = [];
  const subscribers = new Set();
  let running = false;

  function emit(event) {
    for (const fn of subscribers) { try { fn(event); } catch { /* isolate */ } }
  }

  // stream(data) → push a data packet through the fluid to all subscribers.
  function stream(data) {
    const packet = { at: new Date().toISOString(), data };
    emit({ kind: 'stream', packet });
    return packet;
  }

  // update(module) → record a new version of a module's state and broadcast it.
  function update(moduleId, payload) {
    const list = versions.get(moduleId) || [];
    const version = list.length + 1;
    const record = { version, payload, at: new Date().toISOString() };
    list.push(record);
    versions.set(moduleId, list);
    emit({ kind: 'update', moduleId, version });
    return record;
  }

  // rollback(module, version) → restore a previous version (default: previous one).
  function rollback(moduleId, version) {
    const list = versions.get(moduleId);
    if (!list || list.length === 0) return null;
    const target = version ? list.find((r) => r.version === version) : list[list.length - 2] || list[0];
    if (!target) return null;
    const restored = { version: list.length + 1, payload: target.payload, at: new Date().toISOString(), rolledBackFrom: target.version };
    list.push(restored);
    emit({ kind: 'rollback', moduleId, to: target.version });
    return restored;
  }

  // prioritize(task) → enqueue a task with a priority (higher runs first).
  function prioritize(task) {
    queue.push({ id: task.id || `t-${queue.length + 1}`, priority: task.priority ?? 1, run: task.run || (() => {}) });
    queue.sort((a, b) => b.priority - a.priority);
    drain();
    return queue.length;
  }

  // drain() → run queued tasks in priority order across microtasks (parallel-ish).
  function drain() {
    if (running) return;
    running = true;
    queueMicrotask(function step() {
      const task = queue.shift();
      if (!task) { running = false; return; }
      try { emit({ kind: 'task', id: task.id, result: task.run() }); }
      catch (err) { emit({ kind: 'task:error', id: task.id, error: String(err) }); }
      queueMicrotask(step);
    });
  }

  function history(moduleId) { return [...(versions.get(moduleId) || [])]; }
  function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

  return { stream, update, rollback, prioritize, history, subscribe };
}
