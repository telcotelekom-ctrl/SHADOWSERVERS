// Audio engine: procedural ambient drone + event stings via WebAudio.
// No audio files needed — everything is synthesised (serverless, offline).
export class AudioEngine {
  constructor() {
    this.enabled = false;
    this.ctx = null;
    this.master = null;
    this.drone = null;
  }

  enable() {
    if (this.ctx) { this.ctx.resume?.(); this.enabled = true; return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0;
    this.master.connect(this.ctx.destination);
    this._startDrone();
    this.enabled = true;
    this.master.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 2);
  }

  disable() {
    if (!this.ctx) return;
    this.master.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
    this.enabled = false;
  }

  _startDrone() {
    const base = this.ctx.createOscillator();
    base.type = 'sine'; base.frequency.value = 55;
    const fifth = this.ctx.createOscillator();
    fifth.type = 'triangle'; fifth.frequency.value = 82.4;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 8;
    lfo.connect(lfoGain); lfoGain.connect(base.frequency);
    base.connect(this.master); fifth.connect(this.master);
    base.start(); fifth.start(); lfo.start();
    this.drone = { base, fifth, lfo };
  }

  // Short sting when a chapter/act begins.
  sting(freq = 440) {
    if (!this.enabled || !this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = freq;
    g.gain.value = 0.0001;
    o.connect(g); g.connect(this.master);
    const t = this.ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.start(t); o.stop(t + 1);
  }
}
