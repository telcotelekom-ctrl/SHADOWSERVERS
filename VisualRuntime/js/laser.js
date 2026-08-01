// Laser engine: draws the communication lattice between points with
// travelling energy pulses. Chapter 03 "Digital Consciousness".
export class LaserEngine {
  constructor(particles) {
    this.particles = particles;
    this.density = 0.45;      // 0..1 fraction of edges drawn
    this.speed = 0.8;
    this.intensity = 0.7;
    this._t = 0;
  }

  update(dt) { this._t += dt; }

  render(ctx, projected, visibleCount) {
    if (!projected) return;
    const links = this.particles.links;
    const maxEdges = Math.floor(links.length * this.density);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 0.7;
    for (let e = 0; e < maxEdges; e++) {
      const [a, b] = links[e];
      if (a >= visibleCount || b >= visibleCount) continue;
      const pa = projected[a], pb = projected[b];
      if (!pa || !pb) continue;
      const depth = (pa.scale + pb.scale) / 2;
      const alpha = Math.max(0, (depth - 0.7)) * this.intensity;
      if (alpha <= 0.01) continue;
      ctx.strokeStyle = `hsla(190, 100%, 70%, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();

      // travelling pulse along the edge
      const t = ((this._t * this.speed + e * 0.13) % 1);
      const px = pa.x + (pb.x - pa.x) * t;
      const py = pa.y + (pb.y - pa.y) * t;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, 6);
      grad.addColorStop(0, `hsla(320, 100%, 72%, ${alpha})`);
      grad.addColorStop(1, 'hsla(320, 100%, 60%, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
