// Menu engine: radial main menu with hover glow/zoom (Chapter 05 "Knowledge
// Runtime"). Nodes are DOM buttons positioned on a circle; hover triggers the
// Hover→Glow→Zoom→Portal chain described in the screenplay.
const ITEMS = [
  'HOME', 'AI', 'DIGITALNOTAR', 'TEL1', 'EGR', 'RESEARCH',
  'SCIENCE', 'MEDIA', 'COMMUNITY', 'NETWORK', 'PORTAL', 'MODULES', 'SETTINGS'
];

export class MenuEngine {
  constructor(root, { onSelect } = {}) {
    this.root = root;
    this.onSelect = onSelect || (() => {});
    this.visible = 0;      // 0..1 reveal amount, driven by director
    this._built = false;
    this.nodes = [];
  }

  build() {
    if (this._built) return;
    this.root.innerHTML = '';
    this.nodes = ITEMS.map((label, i) => {
      const el = document.createElement('button');
      el.className = 'menu-node';
      el.type = 'button';
      el.textContent = label;
      el.style.animationDelay = `${i * 55}ms`;
      el.addEventListener('click', () => this.onSelect(label, el));
      this.root.appendChild(el);
      return { el, label };
    });
    this._built = true;
  }

  layout(cx, cy, radius) {
    for (let i = 0; i < this.nodes.length; i++) {
      const ang = (i / this.nodes.length) * Math.PI * 2 - Math.PI / 2;
      const r = radius * (0.9 + 0.1 * Math.sin(i));
      this.nodes[i].el.style.left = `${cx + Math.cos(ang) * r}px`;
      this.nodes[i].el.style.top = `${cy + Math.sin(ang) * r}px`;
    }
  }

  setVisible(v) {
    if (v > 0.05 && !this._built) this.build();
    this.visible = v;
    this.root.style.opacity = String(v);
    this.root.style.pointerEvents = v > 0.6 ? 'none' : 'none';
    for (const n of this.nodes) n.el.style.pointerEvents = v > 0.6 ? 'auto' : 'none';
  }
}
