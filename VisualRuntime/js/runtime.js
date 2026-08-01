// VisualRuntime — the engine that chains all sub-engines and drives the
// Director's-Cut screenplay. Browser-native (Canvas 2D + SVG + WebAudio),
// no external libraries, serverless. Boot flow:
//   Browser → Runtime → Director → (Particle · Laser · Portal · Menu · Audio) → Frame
import { Camera } from './camera.js';
import { ParticleEngine } from './particles.js';
import { LaserEngine } from './laser.js';
import { PortalEngine } from './portal.js';
import { MenuEngine } from './menu.js';
import { AudioEngine } from './audio.js';
import { Director } from './director.js';
import { UI } from './ui.js';
import { bindFinalCut } from './final-cut.js';

class VisualRuntime {
  constructor() {
    this.canvas = document.getElementById('vr-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.svg = document.getElementById('vr-svg');

    this.camera = new Camera();
    this.particles = new ParticleEngine();
    this.laser = new LaserEngine(this.particles);
    this.portal = new PortalEngine('./svg/digitalnotar.svg');
    this.menu = new MenuEngine(document.getElementById('vr-menu'), {
      onSelect: (label) => this._onMenuSelect(label)
    });
    this.audio = new AudioEngine();

    // Shared state bag the director writes and engines read.
    this.state = {
      p: this.particles,
      l: this.laser,
      cam: this.camera,
      portal: this.portal,
      menuVisible: 0,
      ghost: false
    };
    // Live control values from the Director Panel.
    this.userCtl = { intensity: 0.7, laser: 0.45, glow: 0.6, spin: 0.3, ghost: true, audio: false };

    this.director = new Director(this);
    this.ui = new UI(this);

    this._resize = this._resize.bind(this);
    this._frame = this._frame.bind(this);
    window.addEventListener('resize', this._resize);
    this._resize();
  }

  setCount(n) { this.particles.rebuild(n); }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.w = window.innerWidth; this.h = window.innerHeight;
    this.canvas.width = this.w * dpr; this.canvas.height = this.h * dpr;
    this.canvas.style.width = this.w + 'px'; this.canvas.style.height = this.h + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  boot() {
    console.log('[VisualRuntime] boot → Runtime → Director → Engines');
    this.finalCut = bindFinalCut(this).render();
    this.director.play();
    this._last = performance.now();
    requestAnimationFrame(this._frame);
  }

  _applyUserControls() {
    const u = this.userCtl;
    const clamp = (v, hi = 1.3) => Math.max(0, Math.min(hi, v));
    // layer live tweaks on top of director's base values
    this.particles.energy = clamp(this.particles.energy * (0.4 + 1.3 * u.intensity));
    this.particles.glow = clamp(this.particles.glow * (0.4 + 1.3 * u.glow), 2);
    this.laser.density = clamp(this.laser.density * (0.4 + 1.3 * u.laser), 1);
    this.laser.intensity = clamp(this.laser.intensity * (0.4 + 1.3 * u.intensity));
    this.camera.spin = this.camera.spin * (0.2 + 1.6 * u.spin);
    if (!u.ghost) this.state.ghost = false;
  }

  _ghostTick(dt) {
    if (!this.state.ghost || !this.userCtl.ghost) return;
    // AI "ghost user": gently highlight menu nodes in sequence
    this._ghostT = (this._ghostT || 0) + dt;
    const nodes = this.menu.nodes;
    if (nodes.length && this._ghostT > 0.9) {
      this._ghostT = 0;
      const i = Math.floor(Math.random() * nodes.length);
      const el = nodes[i].el;
      el.style.transform = 'translate(-50%, -50%) scale(1.2)';
      el.style.boxShadow = '0 0 22px rgba(70,224,255,0.7)';
      setTimeout(() => { el.style.transform = ''; el.style.boxShadow = ''; }, 700);
    }
  }

  _onMenuSelect(label) {
    // Hover→...→App chain endpoint: pulse portal + audio sting.
    this.portal.active = Math.min(1, this.portal.active + 0.4);
    this.camera.bump(0.4);
    this.audio.sting(330 + Math.random() * 220);
    console.log('[VisualRuntime] menu →', label);
  }

  _frame(now) {
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    const cx = this.w / 2, cy = this.h / 2;

    // 1) director writes base params
    const { index, act } = this.director.update(dt, (a) => {
      this.ui.chapterCard(a);
      if (this.userCtl.audio) this.audio.sting(220 + a.index * 40);
    });
    // 2) live panel overrides
    this._applyUserControls();

    // 3) update engines
    this.camera.update(dt);
    this.particles.update(dt);
    this.laser.update(dt);
    this.portal.update(dt);
    this._ghostTick(dt);

    // 4) render
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(4,6,15,0.34)';   // motion-trail fade
    ctx.fillRect(0, 0, this.w, this.h);

    const projected = this.particles.render(ctx, this.camera, cx, cy);
    this.laser.render(ctx, projected, this.particles._visibleCount);
    this.portal.render(ctx, cx, cy, this.particles.radius * this.camera.zoom);

    // menu overlay
    this.menu.setVisible(this.state.menuVisible);
    if (this.state.menuVisible > 0.05) this.menu.layout(cx, cy, Math.min(this.w, this.h) * 0.42);

    // 5) HUD + playhead
    this.ui.syncPlayhead(index);
    this.ui.hud(
      `Kapitel ${String(act.index).padStart(2, '0')}  ${act.title}\n` +
      `points ${this.particles._visibleCount}/${this.particles.count}\n` +
      `laser ${(this.laser.density * 100) | 0}%  energy ${(this.particles.energy * 100) | 0}%\n` +
      `zoom ${this.camera.zoom.toFixed(2)}  spin ${this.camera.spin.toFixed(2)}`
    );

    requestAnimationFrame(this._frame);
  }
}

const runtime = new VisualRuntime();
runtime.boot();
window.VR = runtime; // expose for debugging
