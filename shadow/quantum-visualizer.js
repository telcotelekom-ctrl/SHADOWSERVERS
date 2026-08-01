// Quantum-Fluid Visualizer — draws the flow of a Quantum Fluid stream/merge as a
// glowing animated line. Works with quantum-fluid.js events: subscribe to the
// fluid and call drawFlow() for each stream packet, mapping source→target to
// screen coordinates supplied by the host.
export function createQuantumVisualizer({ color = '#00ffcc', speed = 0.3 } = {}) {
  // drawFlow(path, ctx) — path = {from:{x,y}, to:{x,y}}; ctx.drawLine renders it.
  function drawFlow(path = {}, ctx = {}) {
    if (!ctx.drawLine || !path.from || !path.to) return null;
    ctx.drawLine(path.from, path.to, { glow: true, speed, color });
    return { from: path.from, to: path.to, color };
  }

  // fromEvent(event, resolve, ctx) — convenience: turn a fluid event into a flow.
  // resolve(id)→{x,y} maps a wabe/module id to a screen point.
  function fromEvent(event = {}, resolve, ctx = {}) {
    if (typeof resolve !== 'function') return null;
    const src = event.moduleId || event.source || (event.packet && event.packet.data && event.packet.data.source);
    const tgt = event.target || (event.packet && event.packet.data && event.packet.data.target);
    const from = resolve(src);
    const to = resolve(tgt);
    if (!from || !to) return null;
    return drawFlow({ from, to }, ctx);
  }

  return { drawFlow, fromEvent };
}
