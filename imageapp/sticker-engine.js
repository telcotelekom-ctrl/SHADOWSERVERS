// Sticker Engine — turns a semantic region into a themed, emotional sticker.
export class StickerEngine {
  constructor() {
    this.stickers = [];
  }

  createStickerFromRegion(regionMeta = {}) {
    const sticker = {
      id: `sticker-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      theme: regionMeta.theme || 'memory',
      region: regionMeta,
      style: this._themeToStyle(regionMeta.theme),
      createdAt: Date.now()
    };
    this.stickers.push(sticker);
    return sticker;
  }

  _themeToStyle(theme) {
    switch (theme) {
      case 'family':  return { border: '3px solid #ff6699', glow: '#ffccdd', emoji: '👪' };
      case 'history': return { border: '2px dashed #996633', glow: '#ccaa88', emoji: '📜' };
      case 'memory':  return { border: '2px solid #4f8cff', glow: '#bcd3ff', emoji: '💫' };
      default:        return { border: '2px solid #cccccc', glow: '#eeeeee', emoji: '🏷️' };
    }
  }

  // Render a sticker as an SVG overlay group (optional visual output).
  toSVG(sticker) {
    const NS = 'http://www.w3.org/2000/svg';
    const r = sticker.region || { x: 0, y: 0, w: 100, h: 100 };
    const g = document.createElementNS(NS, 'g');
    const box = document.createElementNS(NS, 'rect');
    box.setAttribute('x', r.x); box.setAttribute('y', r.y);
    box.setAttribute('width', r.w); box.setAttribute('height', r.h);
    box.setAttribute('rx', 14);
    box.setAttribute('fill', 'none');
    box.setAttribute('stroke', sticker.style.glow);
    box.setAttribute('stroke-width', 6);
    g.appendChild(box);
    const emoji = document.createElementNS(NS, 'text');
    emoji.setAttribute('x', r.x + 10); emoji.setAttribute('y', r.y + 34);
    emoji.setAttribute('font-size', 30);
    emoji.textContent = sticker.style.emoji;
    g.appendChild(emoji);
    return g;
  }
}
