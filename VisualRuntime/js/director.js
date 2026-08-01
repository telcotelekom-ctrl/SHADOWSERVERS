// Director: the Director's-Cut screenplay as executable acts. Each chapter
// drives the runtime engines (particles/laser/portal/camera/menu) as a function
// of its local progress. This is the "director.js" regie brain.
import { Timeline, lerp, smooth } from './timeline.js';

// dur = seconds. Total ≈ 96s; scalable via Director.timeScale.
const ACTS = [
  {
    dur: 6, index: 1, title: 'Genesis', sub: 'Schwarz. Ein Lichtpunkt.',
    apply(rt, t) {
      rt.p.buildProgress = smooth(t) * 0.004 + 0.001; // a single point
      rt.p.energy = 0.2 + smooth(t) * 0.2;
      rt.p.glow = 0.9; rt.l.density = 0; rt.cam.spin = 0.05;
    }
  },
  {
    dur: 10, index: 2, title: 'Birth of the Sphere', sub: 'Punkt für Punkt. Berechnet.',
    apply(rt, t) {
      rt.p.buildProgress = smooth(t);              // build up point by point
      rt.p.energy = 0.4; rt.p.glow = 0.7;
      rt.l.density = 0; rt.cam.spin = 0.15;
    }
  },
  {
    dur: 10, index: 3, title: 'Digital Consciousness', sub: 'Linien entstehen. Laser laufen.',
    apply(rt, t) {
      rt.p.buildProgress = 1; rt.p.energy = 0.55;
      rt.l.density = smooth(t) * 0.6; rt.l.intensity = 0.4 + smooth(t) * 0.5;
      rt.cam.spin = 0.25;
    }
  },
  {
    dur: 9, index: 4, title: 'Portal Activation', sub: 'Das TEL1-Logo erscheint.',
    apply(rt, t) {
      rt.p.buildProgress = 1; rt.p.energy = 0.6; rt.l.density = 0.6;
      rt.portal.active = smooth(t); rt.cam.spin = 0.3; rt.cam.zoom = lerp(1, 1.08, smooth(t));
    }
  },
  {
    dur: 12, index: 5, title: 'Knowledge Runtime', sub: 'Menüs entstehen. Daten fließen.',
    apply(rt, t) {
      rt.p.buildProgress = 1; rt.p.energy = 0.7; rt.l.density = 0.7; rt.l.intensity = 0.9;
      rt.portal.active = 1 - smooth(t) * 0.5; rt.menuVisible = smooth(t); rt.cam.spin = 0.28;
    }
  },
  {
    dur: 10, index: 6, title: 'Ghost User', sub: 'Die Oberfläche bewegt sich von selbst.',
    apply(rt, t) {
      rt.p.energy = 0.7; rt.l.density = 0.7; rt.menuVisible = 1;
      rt.ghost = true; rt.cam.spin = 0.35;
    }
  },
  {
    dur: 9, index: 7, title: 'User Control', sub: 'Der Benutzer übernimmt.',
    apply(rt, t) {
      rt.p.energy = 0.7; rt.l.density = 0.7; rt.menuVisible = 1;
      rt.ghost = false; rt.cam.spin = 0.22;
    }
  },
  {
    dur: 8, index: 8, title: 'Portal Merge', sub: 'Kugel verschmilzt mit TEL.',
    apply(rt, t) {
      rt.p.energy = 0.8; rt.l.density = 0.8; rt.menuVisible = 1 - smooth(t);
      rt.portal.active = smooth(t) * 0.6; rt.portal.merge = smooth(t);
      rt.cam.zoom = lerp(1.08, 1.18, smooth(t)); rt.cam.spin = 0.2;
    }
  },
  {
    dur: 10, index: 9, title: 'EGR', sub: 'Explosion. Neue Kristallstrukturen.',
    apply(rt, t, ctx) {
      const burst = t < 0.25 ? smooth(t / 0.25) : 1 - smooth((t - 0.25) / 0.75) * 0.6;
      rt.p.dispersion = burst * 0.9;
      rt.p.energy = 0.9; rt.l.density = 0.9; rt.l.intensity = 1;
      rt.portal.merge = 1 - smooth(t) * 0.6;
      if (ctx && t < 0.05) ctx.cam.bump(1);
      rt.cam.spin = 0.4;
    }
  },
  {
    dur: 12, index: 10, title: 'Universal Runtime', sub: 'Alles lebt. Das Portal endet nie.',
    apply(rt, t) {
      rt.p.dispersion = lerp(0.5, 0, smooth(t)) * 0.3;
      rt.p.energy = 0.75; rt.l.density = 0.75; rt.menuVisible = smooth(t);
      rt.portal.active = 0.2 + Math.sin(t * 6) * 0.1; rt.cam.spin = 0.3;
    }
  }
];

export class Director {
  constructor(runtime) {
    this.runtime = runtime;
    this.timeline = new Timeline(ACTS);
    this.acts = ACTS;
    this.timeScale = 1;
    this._lastIndex = -1;
    this._userOverride = false; // panel sliders take priority when touched
  }

  play() { this.timeline.play(); }
  pause() { this.timeline.pause(); }
  restart() { this._lastIndex = -1; this.timeline.restart(); }
  seekNorm(n) { this.timeline.seekNorm(n); }
  seekAct(i) { this._lastIndex = -1; this.timeline.seekAct(i); }

  update(dt, onChapter) {
    const { index, act, localT } = this.timeline.update(dt * this.timeScale);
    // reset transient state each frame, acts write into it
    const rt = this.runtime.state;
    rt.ghost = rt.ghost && false; // acts re-assert if needed
    act.apply(rt, localT, this.runtime);
    if (index !== this._lastIndex) {
      this._lastIndex = index;
      onChapter?.(act);
    }
    return { index, act, localT };
  }
}
