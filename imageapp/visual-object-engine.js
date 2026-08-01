// Visual Object Engine — turns SVG elements into interactive, semantic objects.
// Each registered element becomes an "object" with a type + metadata and click
// behaviour. Menu items, content zones and stickers all flow through here.
export class VisualObjectEngine {
  constructor(svgRoot) {
    this.svgRoot = svgRoot;
    this.objects = [];
    this._subscribers = new Set();
  }

  registerObject(el, type, meta = {}) {
    if (!el) return null;
    const obj = { el, type, meta, id: meta.id || `obj-${this.objects.length + 1}` };
    this.objects.push(obj);
    this._bindEvents(obj);
    this._emit({ kind: 'register', obj });
    return obj;
  }

  _bindEvents(obj) {
    obj.el.style.cursor = 'pointer';
    obj.el.setAttribute('tabindex', '0');
    if (obj.meta.label) obj.el.setAttribute('aria-label', obj.meta.label);
    const fire = () => {
      obj.el.classList.add('vo-active');
      this._emit({ kind: 'activate', obj });
      if (obj.meta.onClick) obj.meta.onClick(obj);
    };
    obj.el.addEventListener('click', fire);
    obj.el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
    obj.el.addEventListener('mouseenter', () => this._emit({ kind: 'hover', obj }));
  }

  createMenuItem(el, label, action) {
    return this.registerObject(el, 'menu-item', { label, onClick: () => action() });
  }

  find(type) { return this.objects.filter((o) => o.type === type); }

  subscribe(fn) { this._subscribers.add(fn); return () => this._subscribers.delete(fn); }
  _emit(evt) { for (const fn of this._subscribers) { try { fn(evt); } catch { /* isolate */ } } }
}
