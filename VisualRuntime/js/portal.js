// Portal engine: expanding energy rings + the TEL1/DIGITALNOTAR logo reveal
// and merge. Chapters 04 (Portal Activation) & 08 (Portal Merge).
export class PortalEngine {
  constructor(logoSrc = './svg/digitalnotar.svg') {
    this.active = 0;       // 0..1 portal openness
    this.merge = 0;        // 0..1 logo/sphere merge
    this.logo = new Image();
    this.logo.src = logoSrc;
    this.logoReady = false;
    this.logo.onload = () => { this.logoReady = true; };
    this._t = 0;
  }

  update(dt) { this._t += dt; }

  render(ctx, cx, cy, radius) {
    if (this.active <= 0.001 && this.merge <= 0.001) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // expanding rings
    const rings = 4;
    for (let i = 0; i < rings; i++) {
      const phase = (this._t * 0.4 + i / rings) % 1;
      const rr = radius * (0.4 + phase * 1.4);
      const a = (1 - phase) * this.active * 0.5;
      ctx.strokeStyle = `hsla(190, 100%, 70%, ${a})`;
      ctx.lineWidth = 2 + (1 - phase) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    // logo reveal (normal blend so it reads clearly)
    if (this.logoReady) {
      const size = radius * (1.1 + this.merge * 0.3);
      const alpha = Math.max(this.active, this.merge);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, cy);
      const scale = 0.9 + Math.sin(this._t * 1.2) * 0.02 * this.active;
      ctx.scale(scale, scale);
      ctx.drawImage(this.logo, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
}
