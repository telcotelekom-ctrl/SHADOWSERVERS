// Logo-Core-Pulse Engine — the heartbeat of the Hyperkernel core.
// Context-driven: the host (vos.html / universe-live.html) passes a context with
// optional setGlow/setScale hooks; this engine just advances the pulse over time.
// A configurable BPM makes the heartbeat match the living-universe animation.
export function createLogoPulseEngine(context = {}, { bpm = 62 } = {}) {
  let t = 0;
  const omega = (bpm / 60) * Math.PI * 2; // radians per second

  // tick(dt) — advance the pulse. dt in milliseconds (as used by rAF loops).
  function tick(dt = 16) {
    t += dt;
    const phase = (t / 1000) * omega;
    const intensity = (Math.sin(phase) + 1) / 2; // 0..1
    if (context.setGlow) context.setGlow(intensity);
    if (context.setScale) context.setScale(1 + intensity * 0.05);
    return intensity;
  }

  function reset() { t = 0; }

  return { tick, reset, get intensity() { return (Math.sin((t / 1000) * omega) + 1) / 2; } };
}
