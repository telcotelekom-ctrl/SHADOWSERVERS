// Timeline engine: global playhead over a set of timed acts. Deterministic,
// seekable, pausable. Interpolation helpers live here too.
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
export const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

export class Timeline {
  constructor(acts) {
    this.acts = acts;                       // [{dur, ...}]
    this.duration = acts.reduce((s, a) => s + a.dur, 0);
    this.time = 0;
    this.playing = false;
    this._starts = [];
    let acc = 0;
    for (const a of acts) { this._starts.push(acc); acc += a.dur; }
  }

  play() { this.playing = true; }
  pause() { this.playing = false; }
  restart() { this.time = 0; this.playing = true; }
  seekNorm(n) { this.time = clamp01(n) * this.duration; }
  seekAct(index) { this.time = this._starts[index] ?? 0; this.playing = true; }
  get norm() { return this.duration ? this.time / this.duration : 0; }

  update(dt) {
    if (this.playing) {
      this.time += dt;
      if (this.time >= this.duration) this.time = this.duration; // hold on final act
    }
    // find current act
    let idx = 0;
    for (let i = 0; i < this.acts.length; i++) {
      if (this.time >= this._starts[i]) idx = i; else break;
    }
    const localT = clamp01((this.time - this._starts[idx]) / this.acts[idx].dur);
    return { index: idx, act: this.acts[idx], localT };
  }
}
