// Image → semantic SVG. Embeds the uploaded photo as a background <image> and
// overlays interactive semantic zones. The zone detection here is a deterministic
// grid/region split (no AI yet) — the single place to later plug in real vision:
// replace detectRegions() with an AI/vectorisation call that returns the same shape.

const SVG_NS = 'http://www.w3.org/2000/svg';

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadDims(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1000, h: img.naturalHeight || 1000 });
    img.onerror = () => resolve({ w: 1000, h: 1000 });
    img.src = dataUrl;
  });
}

// Placeholder region detector — returns semantic zones over the image.
// Shape of each region: { role, x, y, w, h, theme, label }.
export function detectRegions(w, h) {
  return [
    { role: 'menu',    x: w * 0.05, y: h * 0.06, w: w * 0.32, h: h * 0.16, theme: 'family',  label: 'Menu' },
    { role: 'content', x: w * 0.42, y: h * 0.10, w: w * 0.52, h: h * 0.44, theme: 'memory',  label: 'Content' },
    { role: 'sticker', x: w * 0.08, y: h * 0.60, w: w * 0.30, h: h * 0.30, theme: 'history', label: 'Sticker-zone' },
    { role: 'action',  x: w * 0.55, y: h * 0.66, w: w * 0.35, h: h * 0.22, theme: 'family',  label: 'Actie' }
  ];
}

const ROLE_COLOR = { menu: '#3366ff', content: '#ff9933', sticker: '#ff6699', action: '#33cc99' };

export async function imageToSemanticSVG(file) {
  const dataUrl = await readAsDataURL(file);
  const { w, h } = await loadDims(dataUrl);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('id', 'user-svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const bg = document.createElementNS(SVG_NS, 'image');
  bg.setAttribute('href', dataUrl);
  bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
  bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h));
  svg.appendChild(bg);

  for (const region of detectRegions(w, h)) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', region.x); rect.setAttribute('y', region.y);
    rect.setAttribute('width', region.w); rect.setAttribute('height', region.h);
    rect.setAttribute('rx', Math.min(region.w, region.h) * 0.06);
    rect.setAttribute('fill', (ROLE_COLOR[region.role] || '#8899aa') + '55');
    rect.setAttribute('stroke', ROLE_COLOR[region.role] || '#8899aa');
    rect.setAttribute('stroke-width', Math.max(2, w * 0.004));
    rect.setAttribute('data-role', region.role);
    rect.setAttribute('data-theme', region.theme);
    rect.setAttribute('data-label', region.label);
    svg.appendChild(rect);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', region.x + 12); label.setAttribute('y', region.y + Math.max(24, h * 0.03));
    label.setAttribute('fill', '#fff');
    label.setAttribute('font-size', Math.max(16, w * 0.02));
    label.setAttribute('font-family', 'system-ui, sans-serif');
    label.setAttribute('pointer-events', 'none');
    label.textContent = region.label;
    svg.appendChild(label);
  }

  return svg;
}
