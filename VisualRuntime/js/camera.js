// Camera: 3D→2D projection with orbit rotation and zoom. Pure math, no deps.
export class Camera {
  constructor() {
    this.rotX = -0.35;
    this.rotY = 0;
    this.zoom = 1;
    this.distance = 900;      // perspective focal distance
    this.spin = 0.3;          // auto-spin factor (0..1), driven by director
    this.shake = 0;           // 0..1 transient camera shake
    this._shakeX = 0; this._shakeY = 0;
  }

  update(dt) {
    this.rotY += this.spin * dt * 0.35;
    if (this.shake > 0.001) {
      this._shakeX = (Math.random() - 0.5) * this.shake * 28;
      this._shakeY = (Math.random() - 0.5) * this.shake * 28;
      this.shake *= 0.9;      // decay
    } else { this._shakeX = this._shakeY = 0; }
  }

  // Project a world point {x,y,z} to screen coords + depth scale.
  project(p, cx, cy) {
    const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
    const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
    // rotate around Y then X
    let x = p.x * cosY - p.z * sinY;
    let z = p.x * sinY + p.z * cosY;
    let y = p.y * cosX - z * sinX;
    z = p.y * sinX + z * cosX;
    const scale = (this.distance * this.zoom) / (this.distance + z);
    return {
      x: cx + x * scale + this._shakeX,
      y: cy + y * scale + this._shakeY,
      z,
      scale
    };
  }

  bump(amount = 1) { this.shake = Math.min(1, this.shake + amount); }
}
