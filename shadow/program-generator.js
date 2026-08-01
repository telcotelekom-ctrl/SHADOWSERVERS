// Program Generator (blueprint §10) — "dit is wat je miste".
// This is the step that turns the architecture document into a RUNNING system.
// It reads a declarative architecture spec, extracts the modules, builds the
// kernel, matrix, VOS and Shadow Server for real, integrates the existing apps as
// wabe-clusters, compiles them into one live system object and "deploys" it (boots
// the Hyperkernel). The output is an executable system instance — not a webpage.

import { createWabeMatrix } from './wabe-matrix.js';
import { createShadowServer } from './shadow-server.js';
import { createIdentityCore } from './identity-core.js';
import { createWorkforce } from './arbeiterinnen.js';
import { createQuantumFluid } from './quantum-fluid.js';
import { createVisualOS } from './vos-kernel.js';
import { createProgramSynthesizer } from './program-synthesis.js';
import { listLogic } from './wabe-logic.js';

// The strict, input-based architecture description (blueprint §1–§9).
// Everything here comes from the user's own document — no additions.
export const USUP_ARCHITECTURE = {
  root: { name: 'Universe System Unified Package', code: 'USUP', type: 'Multi-layer software ecosystem' },
  modules: [
    { key: 'identity', section: '3', title: 'Identity Core' },
    { key: 'matrix', section: '4', title: 'Wabenmatrix' },
    { key: 'workforce', section: '5', title: 'Arbeiterinnen-System' },
    { key: 'fluid', section: '6', title: 'Quantum Fluid Layer' },
    { key: 'vos', section: '7', title: 'Visual Operating System' },
    { key: 'shadow', section: '8', title: 'Shadow Server' }
  ],
  apps: {
    INTERACTIE: ['Spidermouse'],
    BEDRIJF: ['Business Suite'],
    HR: ['Sollicitatieportaal'],
    INVESTERING: ['Investor Calculator'],
    PARTICIPATIE: ['Financiële Bedelingen'],
    FISCAAL: ['Fiscale Calculator'],
    REGISTRATIE: ['Formal Registry']
  }
};

export function createProgramGenerator() {
  const buildLog = [];
  const log = (step, detail) => { const e = { at: new Date().toISOString(), step, detail }; buildLog.push(e); return e; };

  // read(architecture_document) → accept + normalise the spec.
  function read(architecture = USUP_ARCHITECTURE) {
    log('read', architecture.root ? architecture.root.code : 'spec');
    return architecture;
  }

  // extract(modules) → list the modules to build from the spec.
  function extract(architecture) {
    const modules = architecture.modules.map((m) => m.key);
    log('extract', modules.join(', '));
    return modules;
  }

  // build(...) → instantiate each subsystem for real.
  function build(architecture) {
    const identity = createIdentityCore();
    const matrix = createWabeMatrix({ clusters: architecture.apps });
    const fluid = createQuantumFluid();
    const workforce = createWorkforce(matrix, 3);
    const vos = createVisualOS(fluid);
    const shadow = createShadowServer(matrix);
    log('build', 'identity, matrix, fluid, workforce, vos, shadow');
    return { identity, matrix, fluid, workforce, vos, shadow };
  }

  // integrate(existing_apps) → register apps as identities + connect fluid ⇄ matrix.
  function integrate(system, architecture) {
    for (const [cluster, apps] of Object.entries(architecture.apps)) {
      identityRegister(system.identity, cluster, 'module');
      for (const app of apps) identityRegister(system.identity, app, 'module');
    }
    for (const { key } of listLogic()) {
      identityRegister(system.identity, key, 'logic');
    }
    // Every matrix change streams through the Quantum Fluid transport.
    system.matrix.subscribe((event) => system.fluid.stream({ source: 'matrix', event }));
    log('integrate', `${system.identity.count()} identities, fluid⇄matrix bound`);
    return system;
  }

  function identityRegister(identity, label, kind) {
    const { id } = identity.register({ kind, label });
    identity.set_permissions(id, ['read', 'simulate']);
    return id;
  }

  // compile(system) → assemble one coherent, callable system object.
  function compile(system, architecture) {
    const synthesizer = createProgramSynthesizer(system.matrix, system.shadow);
    const compiled = {
      name: architecture.root.name,
      code: architecture.root.code,
      ...system,
      // A single entry point that runs a proposal through the Shadow Server.
      run(proposal) { return system.shadow.runProposal(proposal); },
      promote(report) { return system.shadow.promote(report); },
      // Ultra-Stufe V: build + deploy a brand-new program from a declarative spec.
      synthesize(spec) { return synthesizer.synthesize(spec); },
      deploySynthesized(spec, input) { return synthesizer.deploy(spec, input); },
      status() {
        return {
          code: architecture.root.code,
          matrix: system.matrix.snapshot(),
          identities: system.identity.count(),
          logic: listLogic().map((l) => l.key)
        };
      }
    };
    log('compile', 'system object ready');
    return compiled;
  }

  // deploy(environment) → boot the compiled system (register a root operator).
  function deploy(compiled, environment = 'browser') {
    const opId = compiled.identity.register({ kind: 'user', label: 'root-operator', roles: ['operator'] }).id;
    compiled.identity.set_permissions(opId, ['read', 'simulate', 'promote']);
    log('deploy', environment);
    return { ...compiled, environment, operator: opId, buildLog: [...buildLog] };
  }

  // generate() → the full pipeline, exactly as blueprint §10.1 describes.
  function generate(architecture = USUP_ARCHITECTURE) {
    const spec = read(architecture);
    extract(spec);
    const system = build(spec);
    integrate(system, spec);
    const compiled = compile(system, spec);
    return deploy(compiled);
  }

  return { read, extract, build, integrate, compile, deploy, generate, buildLog() { return [...buildLog]; } };
}
