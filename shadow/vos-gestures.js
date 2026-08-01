// Ultra-Stufe IV — VOS Gestures & Fractal Engine (browser-native).
// The executable core of the Visual Operating System's navigation layer. It gives
// vos.html / universe-live.html a REAL fractal viewport (infinite-feel pan/zoom
// with smooth interpolation and coordinate transforms) plus a gesture pipeline
// that turns raw pointer/wheel/key events into VOS intents via the VOSKernel.
//
// No framework, no DOM assumptions — pure math + event mapping. UI-agnostic.

// A fractal viewport: world<->screen transform with inertial smoothing.
export function createFractalViewport({
  minScale = 0.15, maxScale = 6, smoothing = 0.18
} = {}) {
  const state = { x: 0, y: 0, scale: 1 };      // current (rendered)
  const target = { x: 0, y: 0, scale: 1 };     // where we're heading

  function clampScale(s) { return Math.max(minScale, Math.min(maxScale, s)); }

  // Zoom toward a screen anchor so the point under the cursor stays put.
  function zoomAt(screenX, screenY, factor) {
    const before = screenToWorld(screenX, screenY);
    target.scale = clampScale(target.scale * factor);
    // Re-anchor using the target scale.
    const k = target.scale;
    target.x = screenX - before.x * k;
    target.y = screenY - before.y * k;
    return { scale: target.scale };
  }

  function panBy(dx, dy) { target.x += dx; target.y += dy; return { x: target.x, y: target.y }; }

  function centerOn(worldX, worldY, screenW, screenH) {
    target.x = screenW / 2 - worldX * target.scale;
    target.y = screenH / 2 - worldY * target.scale;
  }

  function reset() { target.x = 0; target.y = 0; target.scale = 1; }

  // Call once per animation frame to ease current toward target.
  function step() {
    state.x += (target.x - state.x) * smoothing;
    state.y += (target.y - state.y) * smoothing;
    state.scale += (target.scale - state.scale) * smoothing;
    return { ...state };
  }

  function worldToScreen(wx, wy) {
    return { x: wx * state.scale + state.x, y: wy * state.scale + state.y };
  }
  function screenToWorld(sx, sy) {
    return { x: (sx - target.x) / target.scale, y: (sy - target.y) / target.scale };
  }

  // Apply the transform to a Canvas 2D context (call between save/restore).
  function applyToContext(ctx) { ctx.setTransform(state.scale, 0, 0, state.scale, state.x, state.y); }

  return {
    state, target, zoomAt, panBy, centerOn, reset, step,
    worldToScreen, screenToWorld, applyToContext,
    get scale() { return state.scale; }
  };
}

// Gesture pipeline: raw events → VOSKernel gesture → viewport action + intent.
export function createGesturePipeline(vosKernel, viewport) {
  const subscribers = new Set();
  let dragging = false;
  let last = { x: 0, y: 0 };

  const emit = (e) => { for (const fn of subscribers) { try { fn(e); } catch { /* isolate */ } } };

  function onWheel(ev) {
    const g = vosKernel.recognize_gesture({ type: 'wheel', deltaY: ev.deltaY });
    const factor = g.direction === 'in' ? 1.12 : 1 / 1.12;
    const r = viewport.zoomAt(ev.offsetX ?? ev.clientX ?? 0, ev.offsetY ?? ev.clientY ?? 0, factor);
    emit({ gesture: g, action: 'zoom', ...r });
    return g;
  }

  function onPointerDown(ev) { dragging = true; last = { x: ev.clientX, y: ev.clientY }; }
  function onPointerUp() { dragging = false; }

  function onPointerMove(ev) {
    if (!dragging) return null;
    const dx = ev.clientX - last.x, dy = ev.clientY - last.y;
    last = { x: ev.clientX, y: ev.clientY };
    const g = vosKernel.recognize_gesture({ type: 'drag', dx, dy });
    viewport.panBy(dx, dy);
    emit({ gesture: g, action: 'pan', dx, dy });
    return g;
  }

  function onTap(ev, target) {
    const g = vosKernel.recognize_gesture({ type: 'tap', target });
    const world = viewport.screenToWorld(ev.clientX, ev.clientY);
    emit({ gesture: g, action: 'select', target, world });
    return g;
  }

  // Symbolic keyboard commands mapped through the VOSKernel symbol table.
  function onSymbol(symbol) {
    const intent = vosKernel.interpret(symbol);
    emit({ gesture: { gesture: 'symbol' }, action: 'intent', intent });
    return intent;
  }

  // Attach to a DOM element (browser only). Returns a detach function.
  function attach(el) {
    const wheel = (e) => { e.preventDefault(); onWheel(e); };
    el.addEventListener('wheel', wheel, { passive: false });
    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointermove', onPointerMove);
    return () => {
      el.removeEventListener('wheel', wheel);
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointermove', onPointerMove);
    };
  }

  function subscribe(fn) { subscribers.add(fn); return () => subscribers.delete(fn); }

  return { onWheel, onPointerDown, onPointerUp, onPointerMove, onTap, onSymbol, attach, subscribe };
}
