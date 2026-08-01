// UI: wires the Director Panel (Regiepult) controls to the runtime. Slider
// values are stored on runtime.userCtl and applied each frame after the director,
// so live tweaks layer on top of the screenplay.
export class UI {
  constructor(runtime) {
    this.rt = runtime;
    this.seeking = false;
    this._wire();
    this._buildActList();
  }

  $(id) { return document.getElementById(id); }

  _wire() {
    const rt = this.rt;
    this.$('panel-toggle').addEventListener('click', (e) => {
      this.$('director-panel').classList.toggle('collapsed');
      e.target.textContent = this.$('director-panel').classList.contains('collapsed') ? '▸' : '▾';
    });
    this.$('btn-play').addEventListener('click', () => rt.director.play());
    this.$('btn-pause').addEventListener('click', () => rt.director.pause());
    this.$('btn-restart').addEventListener('click', () => rt.director.restart());

    const time = this.$('ctl-time');
    time.addEventListener('pointerdown', () => { this.seeking = true; });
    time.addEventListener('pointerup', () => { this.seeking = false; });
    time.addEventListener('input', () => rt.director.seekNorm(+time.value / 1000));

    const bind = (id, key, transform = (v) => v / 100) => {
      const el = this.$(id);
      const set = () => { rt.userCtl[key] = transform(+el.value); };
      el.addEventListener('input', set); set();
    };
    bind('ctl-intensity', 'intensity');
    bind('ctl-laser', 'laser');
    bind('ctl-glow', 'glow');
    bind('ctl-spin', 'spin');
    this.$('ctl-count').addEventListener('input', (e) => rt.setCount(+e.target.value));
    this.$('ctl-ghost').addEventListener('change', (e) => { rt.userCtl.ghost = e.target.checked; });
    this.$('ctl-audio').addEventListener('change', (e) => {
      rt.userCtl.audio = e.target.checked;
      if (e.target.checked) rt.audio.enable(); else rt.audio.disable();
    });
  }

  _buildActList() {
    const list = this.$('act-list');
    this.rt.director.acts.forEach((a, i) => {
      const b = document.createElement('button');
      b.textContent = a.index;
      b.title = a.title;
      b.addEventListener('click', () => this.rt.director.seekAct(i));
      list.appendChild(b);
    });
    this.actButtons = [...list.children];
  }

  syncPlayhead(index) {
    if (!this.seeking) this.$('ctl-time').value = String(Math.round(this.rt.director.timeline.norm * 1000));
    this.actButtons.forEach((b, i) => b.classList.toggle('active', i === index));
  }

  hud(text) { this.$('hud').textContent = text; }

  chapterCard(act) {
    this.$('chapter-index').textContent = String(act.index).padStart(2, '0');
    this.$('chapter-title').textContent = act.title;
    this.$('chapter-sub').textContent = act.sub;
    const card = this.$('chapter-card');
    card.classList.add('show');
    clearTimeout(this._cardTimer);
    this._cardTimer = setTimeout(() => card.classList.remove('show'), 3600);
  }
}
