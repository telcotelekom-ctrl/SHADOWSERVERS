// Particle engine: the living sphere of light points.
// Chapter 02 builds it point-by-point (buildProgress); each point pulses.
import { fibonacciSphere, nearestNeighbours } from './globe.js';

export class ParticleEngine {
  constructor() {
    this.radius = 300;
    this.count = 2200;
    this.points = [];
    this.links = [];
    this.buildProgress = 0;   // 0..1 → how many points are "born"
    this.energy = 0.6;        // 0..1 glow/motion energy
    this.glow = 0.6;          // bloom strength
    this.dispersion = 0;      // 0..1 explosion offset (Chapter 09 EGR)
    this._t = 0;
    this.rebuild(this.count);
  }

  rebuild(count) {
    this.count = Math.max(50, Math.floor(count));
    this.points = fibonacciSphere(this.count, this.radius).map((p) => ({
      ...p,
      phase: Math.random() * Math.PI * 2,
      hue: 190 + (p.y / this.radius) * 40,
      vx: p.x, vy: p.y, vz: p.z
    }));
    this.links = nearestNeighbours(this.points, 3);
  }

  update(dt) {
    this._t += dt;
    const disp = this.dispersion;
    for (const p of this.points) {
      const wobble = 1 + Math.sin(this._t * 1.4 + p.phase) * 0.02 * this.energy;
      p.vx = p.x * wobble + (p.x * disp * (0.6 + Math.sin(p.phase) * 0.4));
      p.vy = p.y * wobble + (p.y * disp * (0.6 + Math.cos(p.phase) * 0.4));
      p.vz = p.z * wobble;
    }
  }

  render(ctx, camera, cx, cy) {
    const visible = Math.floor(this.points.length * this.buildProgress);
    const projected = new Array(this.points.length);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < visible; i++) {
      const p = this.points[i];
      const s = camera.project({ x: p.vx, y: p.vy, z: p.vz }, cx, cy);
      projected[i] = s;
      const depth = (s.scale - 0.6) / 0.8;                 // 0..1-ish
      const pulse = 0.6 + 0.4 * Math.sin(this._t * 2 + p.phase);
      const r = Math.max(0.6, 1.8 * s.scale * (0.7 + this.energy * 0.6));
      const a = Math.max(0.05, Math.min(1, depth)) * pulse;
      const glowR = r * (2.5 + this.glow * 3);
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
      grad.addColorStop(0, `hsla(${p.hue}, 100%, 72%, ${a})`);
      grad.addColorStop(1, 'hsla(200, 100%, 60%, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    this._projected = projected;
    this._visibleCount = visible;
    return projected;
  }
}
