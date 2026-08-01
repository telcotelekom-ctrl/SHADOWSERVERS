// Visual Operating System kernel (blueprint §7) — the executable brain behind
// vos.html. Three layers as in the blueprint:
//   §7.1 VOSKernel  : interpret symbols, recognise gestures, visual memory, routing
//   §7.2 VIL        : render symbols, fractal navigation, feedback
//   §7.3 OPL        : schedule tasks, manage visual flow, evolve structure
// It is UI-agnostic: vos.html wires these to SVG, but the logic lives here and is
// fully testable on its own.

// §7.1 — VOS Kernel
export function createVOSKernel() {
  const visualMemory = new Map(); // cellId -> visual state
  const symbolTable = {
    'Ω': 'boot', '∞': 'expand', '🜁': 'unify', '+': 'add', '→': 'link', '↑': 'promote', '∑': 'compute'
  };

  // interpret(symbol) → map a symbolic command to a system intent.
  function interpret(symbol) {
    const intent = symbolTable[symbol] || 'noop';
    return { symbol, intent };
  }

  // recognize_gesture(input) → classify a pointer/wheel gesture.
  function recognizeGesture(input = {}) {
    if (input.type === 'wheel') return { gesture: 'zoom', direction: input.deltaY < 0 ? 'in' : 'out' };
    if (input.type === 'drag') return { gesture: 'pan', dx: input.dx || 0, dy: input.dy || 0 };
    if (input.type === 'tap') return { gesture: 'select', target: input.target };
    return { gesture: 'unknown' };
  }

  // manage_visual_memory(cell) → store/retrieve a rendered cell's visual state.
  function manageVisualMemory(cell) {
    if (!cell || !cell.id) return null;
    visualMemory.set(cell.id, { ...visualMemory.get(cell.id), ...cell, seenAt: new Date().toISOString() });
    return visualMemory.get(cell.id);
  }

  // route_visual(element, target) → produce a routing instruction for the VIL.
  function routeVisual(element, target) {
    return { from: element, to: target, at: new Date().toISOString() };
  }

  return {
    interpret,
    recognize_gesture: recognizeGesture,
    manage_visual_memory: manageVisualMemory,
    route_visual: routeVisual,
    memory() { return [...visualMemory.values()]; }
  };
}

// §7.2 — Visual Interaction Layer (fractal navigation state)
export function createVIL(view = { x: 0, y: 0, scale: 1 }) {
  const feed = [];

  function render(symbol) { return { render: symbol, at: Date.now() }; }

  // navigate(fractal) → update the pan/zoom viewport with clamping.
  function navigate(fractal = {}) {
    if (typeof fractal.dx === 'number') view.x += fractal.dx;
    if (typeof fractal.dy === 'number') view.y += fractal.dy;
    if (typeof fractal.zoom === 'number') view.scale = Math.min(4, Math.max(0.4, view.scale * fractal.zoom));
    if (typeof fractal.scale === 'number') view.scale = Math.min(4, Math.max(0.4, fractal.scale));
    return { ...view };
  }

  function feedback(event) { feed.push({ at: Date.now(), event }); return event; }

  return { render, navigate, feedback, view() { return { ...view }; }, transform() { return `translate(${view.x} ${view.y}) scale(${view.scale})`; } };
}

// §7.3 — Optical Process Layer (visual task scheduling + structure evolution)
export function createOPL(fluid = null) {
  const flow = [];

  // schedule(task) → route a visual task through the Quantum Fluid if present.
  function schedule(task) {
    if (fluid) return fluid.prioritize({ id: task.id, priority: task.priority ?? 1, run: task.run });
    flow.push(task);
    return flow.length;
  }

  function manageFlow(visualData) { flow.push({ at: Date.now(), visualData }); return flow.length; }

  // evolve(structure) → suggest a denser fractal layout as the structure grows.
  function evolve(structure = {}) {
    const n = structure.wabeCount || 0;
    const rings = Math.max(1, Math.ceil(Math.sqrt(n)));
    return { rings, perRing: Math.ceil(n / rings), advice: n > 40 ? 'cluster into sub-fractals' : 'single fractal ok' };
  }

  return { schedule, manage_flow: manageFlow, evolve, flow() { return [...flow]; } };
}

// Convenience: assemble the full VOS from its three layers.
export function createVisualOS(fluid = null) {
  return { kernel: createVOSKernel(), vil: createVIL(), opl: createOPL(fluid) };
}
