// Shadow-Simulation Visualizer — optional visual hook for the Shadow Server.
// The Shadow Server emits simulate/validate/promote events; this maps them to
// visual cues (flash, expand) on a provided ctx. Purely optional: if no ctx is
// wired, the server runs unchanged.
export function createShadowVisualizer() {
  // visualize(event, ctx) — react to a Shadow Server lifecycle event.
  function visualize(event = {}, ctx = {}) {
    switch (event.type) {
      case 'simulate':
        if (ctx.flash) ctx.flash('yellow', event);
        break;
      case 'validate':
        if (ctx.flash) ctx.flash(event.ok ? 'green' : 'red', event);
        break;
      case 'promote':
        if (ctx.expand) ctx.expand(event);
        break;
      default:
        break;
    }
    return event.type || 'noop';
  }

  return { visualize };
}
