// Wabe-Animation Engine — turns a matrix cell's real state into visual signals.
// The Wabenmatrix cells have no "activity" field, so energy is DERIVED from the
// real data: recent log activity + status weight. The visual layer (SVG/Canvas)
// provides a ctx with optional setScale/setColor/pulse hooks.

const STATUS_WEIGHT = { historical: 0.15, concept: 0.35, 'in-development': 0.6, validated: 1 };
const TYPE_COLOR = {
  module: '#ffcf5c', concept: '#4f8cff', data: '#3ddc84', code: '#a56bff', process: '#ff9900'
};

// energyOf(wabe) → 0..1 from log recency + status. Pure, no side effects.
export function energyOf(wabe) {
  if (!wabe) return 0;
  const logs = wabe.log || [];
  const last = logs.length ? Date.parse(logs[logs.length - 1].at) : Date.parse(wabe.createdAt || 0);
  const ageMs = Math.max(0, Date.now() - (last || 0));
  const recency = Math.exp(-ageMs / 60000);         // decays over ~1 min
  const activity = Math.min(1, logs.length / 8);      // more log entries = busier
  const status = STATUS_WEIGHT[wabe.status] ?? 0.35;
  return Math.min(1, 0.5 * recency + 0.3 * activity + 0.2 * status);
}

export function createWabeAnimator() {
  // animate(wabe, ctx) — drive the visual layer from a cell's derived energy.
  function animate(wabe, ctx = {}) {
    const energy = typeof wabe.activity === 'number' ? wabe.activity : energyOf(wabe);
    const size = 1 + energy * 0.2;
    const color = TYPE_COLOR[wabe.type] || (energy > 0.5 ? '#ff9900' : '#3399ff');
    if (ctx.setScale) ctx.setScale(size);
    if (ctx.setColor) ctx.setColor(color);
    if (ctx.pulse) ctx.pulse(energy);
    return { energy, size, color };
  }

  return { animate };
}
