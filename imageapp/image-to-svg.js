// Image → semantic SVG with REAL on-device analysis (no server, no cloud).
// The photo is drawn to an offscreen canvas; a grid of cells is measured for
// average colour and texture/detail (luminance variance). Significant cells are
// merged into regions by colour similarity, then each region is classified into a
// semantic role (content / menu / sticker / action). This is genuine, deterministic
// computer vision running entirely in the browser — the one place to later swap in
// a heavier model is analyzeRegions().

const SVG_NS = 'http://www.w3.org/2000/svg';

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Analyse the image into semantic regions using colour + texture segmentation.
// Shape of each region: { role, x, y, w, h, theme, label, color }.
export function analyzeRegions(img) {
  const W = img.naturalWidth || 1000, H = img.naturalHeight || 1000;
  const GX = 10, GY = 10;                        // analysis grid
  const cw = 64, ch = 64;                          // downscaled sample canvas
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = ch;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(img, 0, 0, cw, ch);
  const data = cx.getImageData(0, 0, cw, ch).data;

  // Per grid-cell statistics: average colour + texture (luminance variance).
  const cells = [];
  for (let gy = 0; gy < GY; gy++) {
    for (let gx = 0; gx < GX; gx++) {
      const x0 = Math.floor(gx / GX * cw), x1 = Math.floor((gx + 1) / GX * cw);
      const y0 = Math.floor(gy / GY * ch), y1 = Math.floor((gy + 1) / GY * ch);
      let r = 0, g = 0, b = 0, n = 0; const lums = [];
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * cw + x) * 4;
          r += data[i]; g += data[i + 1]; b += data[i + 2];
          lums.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          n++;
        }
      }
      n = n || 1; r /= n; g /= n; b /= n;
      const mean = lums.reduce((a, v) => a + v, 0) / lums.length;
      const variance = lums.reduce((a, v) => a + (v - mean) ** 2, 0) / lums.length;
      cells.push({ gx, gy, r, g, b, lum: mean, detail: Math.sqrt(variance) });
    }
  }

  // Significant cells = detail at/above the median (texture-rich = interesting).
  const sortedDetail = cells.map((c) => c.detail).sort((a, b) => a - b);
  const median = sortedDetail[Math.floor(sortedDetail.length / 2)] || 0;
  const idx = (gx, gy) => gy * GX + gx;
  const significant = cells.map((c) => c.detail >= Math.max(6, median));

  // Connected-component merge of significant cells by colour similarity.
  const seen = new Array(cells.length).fill(false);
  const groups = [];
  const close = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 120;
  for (let gy = 0; gy < GY; gy++) {
    for (let gx = 0; gx < GX; gx++) {
      const i = idx(gx, gy);
      if (seen[i] || !significant[i]) continue;
      const stack = [[gx, gy]]; const group = [];
      seen[i] = true;
      while (stack.length) {
        const [x, y] = stack.pop();
        const ci = idx(x, y);
        group.push(cells[ci]);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= GX || ny >= GY) continue;
          const ni = idx(nx, ny);
          if (seen[ni] || !significant[ni]) continue;
          if (close(cells[ci], cells[ni])) { seen[ni] = true; stack.push([nx, ny]); }
        }
      }
      if (group.length >= 2) groups.push(group);
    }
  }

  // Score + sort groups by total detail; keep the strongest few.
  const scored = groups.map((grp) => {
    const minx = Math.min(...grp.map((c) => c.gx)), maxx = Math.max(...grp.map((c) => c.gx));
    const miny = Math.min(...grp.map((c) => c.gy)), maxy = Math.max(...grp.map((c) => c.gy));
    const r = grp.reduce((a, c) => a + c.r, 0) / grp.length;
    const g = grp.reduce((a, c) => a + c.g, 0) / grp.length;
    const b = grp.reduce((a, c) => a + c.b, 0) / grp.length;
    const detail = grp.reduce((a, c) => a + c.detail, 0);
    const lum = grp.reduce((a, c) => a + c.lum, 0) / grp.length;
    return {
      detail, lum, color: { r: Math.round(r), g: Math.round(g), b: Math.round(b) },
      x: minx / GX * W, y: miny / GY * H,
      w: (maxx - minx + 1) / GX * W, h: (maxy - miny + 1) / GY * H
    };
  }).sort((a, b) => b.detail - a.detail).slice(0, 4);

  if (scored.length === 0) return detectRegions(W, H); // fallback if flat image

  // Classify: rank 0 = content, then menu/sticker/action; theme from warmth.
  const roles = ['content', 'menu', 'sticker', 'action'];
  const nameOf = { content: 'Content', menu: 'Menu', sticker: 'Sticker', action: 'Actie' };
  return scored.map((rg, i) => {
    const warm = rg.color.r - rg.color.b;
    const theme = warm > 20 ? 'family' : warm < -20 ? 'memory' : 'history';
    const role = roles[i] || 'action';
    return { role, theme, x: rg.x, y: rg.y, w: rg.w, h: rg.h, color: rg.color, label: nameOf[role] };
  });
}

// Fallback region layout for flat/low-detail images.
export function detectRegions(w, h) {
  return [
    { role: 'menu',    x: w * 0.05, y: h * 0.06, w: w * 0.32, h: h * 0.16, theme: 'family',  label: 'Menu' },
    { role: 'content', x: w * 0.42, y: h * 0.10, w: w * 0.52, h: h * 0.44, theme: 'memory',  label: 'Content' },
    { role: 'sticker', x: w * 0.08, y: h * 0.60, w: w * 0.30, h: h * 0.30, theme: 'history', label: 'Sticker' },
    { role: 'action',  x: w * 0.55, y: h * 0.66, w: w * 0.35, h: h * 0.22, theme: 'family',  label: 'Actie' }
  ];
}

const ROLE_COLOR = { menu: '#3366ff', content: '#ff9933', sticker: '#ff6699', action: '#33cc99' };

export async function imageToSemanticSVG(file) {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || 1000, h = img.naturalHeight || 1000;
  const regions = analyzeRegions(img);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('id', 'user-svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const bg = document.createElementNS(SVG_NS, 'image');
  bg.setAttribute('href', dataUrl);
  bg.setAttribute('x', '0'); bg.setAttribute('y', '0');
  bg.setAttribute('width', String(w)); bg.setAttribute('height', String(h));
  svg.appendChild(bg);

  for (const region of regions) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', region.x); rect.setAttribute('y', region.y);
    rect.setAttribute('width', region.w); rect.setAttribute('height', region.h);
    rect.setAttribute('rx', Math.min(region.w, region.h) * 0.06);
    rect.setAttribute('fill', (ROLE_COLOR[region.role] || '#8899aa') + '3a');
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
