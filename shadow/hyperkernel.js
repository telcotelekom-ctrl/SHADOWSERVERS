// Hyperkernel + USUP root (blueprint §1–§2).
// The Hyperkernel is the central control core. It boots the whole Universe System
// Unified Package by driving the Program Generator, then exposes process
// management, integrity enforcement and update validation over the live system.
// This is the single executable entry point for the entire architecture.

import { createProgramGenerator, USUP_ARCHITECTURE } from './program-generator.js';

export function createHyperkernel() {
  let system = null;              // the compiled, deployed USUP system
  const processes = new Map();    // running processes by id
  let procCounter = 0;

  // init() / load(...) → build every subsystem via the Program Generator.
  function init(architecture = USUP_ARCHITECTURE) {
    const generator = createProgramGenerator();
    system = generator.generate(architecture);
    return status();
  }

  // manage_processes() → register + run a process against the live system.
  function manageProcess(name, fn) {
    if (!system) throw new Error('Hyperkernel not initialised — call init() first');
    const id = `proc-${++procCounter}`;
    const record = { id, name, startedAt: new Date().toISOString(), state: 'running' };
    processes.set(id, record);
    try {
      record.result = fn(system);
      record.state = 'done';
    } catch (err) {
      record.state = 'error';
      record.error = String(err);
    }
    return record;
  }

  // validate_updates() → route an update through the Shadow Server (never direct).
  function validateUpdate(proposal) {
    if (!system) throw new Error('Hyperkernel not initialised');
    return system.run(proposal);
  }

  // enforce_integrity() → confirm all core subsystems + validated modules exist.
  function enforceIntegrity() {
    if (!system) return { ok: false, reason: 'not initialised' };
    const snap = system.matrix.snapshot();
    const checks = [
      { name: 'identity-core', pass: system.identity.count() > 0 },
      { name: 'wabenmatrix', pass: snap.wabeCount > 0 },
      { name: 'shadow-server', pass: typeof system.run === 'function' },
      { name: 'vos', pass: Boolean(system.vos && system.vos.kernel) },
      { name: 'quantum-fluid', pass: Boolean(system.fluid) },
      { name: 'validated-modules', pass: (snap.byStatus.validated || 0) > 0 }
    ];
    return { ok: checks.every((c) => c.pass), checks };
  }

  function status() {
    return {
      booted: Boolean(system),
      system: system ? system.status() : null,
      processes: [...processes.values()].map((p) => ({ id: p.id, name: p.name, state: p.state }))
    };
  }

  return {
    init,
    load: init, // blueprint alias: load(identity_core)/load(wabenmatrix)/... all handled by init()
    manage_processes: manageProcess,
    validate_updates: validateUpdate,
    enforce_integrity: enforceIntegrity,
    status,
    system() { return system; }
  };
}

// Boot the entire Universe System in one call. Returns the running Hyperkernel.
export function bootUSUP(architecture = USUP_ARCHITECTURE) {
  const hyperkernel = createHyperkernel();
  hyperkernel.init(architecture);
  return hyperkernel;
}
