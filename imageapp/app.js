// App wiring for "Your Image to App".
import { VisualObjectEngine } from './visual-object-engine.js';
import { imageToSemanticSVG } from './image-to-svg.js';
import { StickerEngine } from './sticker-engine.js';
import { UserSpace } from './user-space.js';

const $ = (id) => document.getElementById(id);
const canvasContainer = $('canvas-container');
const appPreview = $('app-preview');
const archiveEl = $('archive');
const statusEl = $('status');

const stickerEngine = new StickerEngine();
const userSpace = new UserSpace();
let engine = null;
let currentSVG = null;
let currentRegions = { menu: null };

function status(msg) { statusEl.textContent = msg; }
function renderArchive() {
  const s = userSpace.summary();
  archiveEl.textContent =
    `apps: ${s.apps} · media: ${s.media} · stickers: ${s.stickers}\n\n` +
    JSON.stringify(userSpace.state, null, 2);
}
renderArchive();

// ---------- Service worker (relative scope) ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(
    () => status('Service worker actief — app werkt offline.'),
    (err) => status('Service worker niet geregistreerd: ' + err.message)
  );
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data === 'SW_UNREGISTERED') status('App verwijderd. Herlaad om opnieuw te installeren.');
  });
}

// ---------- Install / uninstall ----------
let deferredPrompt = null;
const installBtn = $('install-btn');
const uninstallBtn = $('uninstall-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.hidden = false;
});
window.addEventListener('appinstalled', () => {
  installBtn.hidden = true;
  uninstallBtn.hidden = false;
  status('App geïnstalleerd.');
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (choice.outcome === 'accepted') { installBtn.hidden = true; uninstallBtn.hidden = false; }
});

uninstallBtn.addEventListener('click', () => {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('UNREGISTER_SW');
  }
  userSpace.clearAll();
  renderArchive();
  uninstallBtn.hidden = true;
  status('Verwijderd: service worker + user-space gewist.');
});

// ---------- Image → semantic SVG → interactive objects ----------
$('image-input').addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  status('Analyseren…');
  currentSVG = await imageToSemanticSVG(file);
  canvasContainer.innerHTML = '';
  canvasContainer.appendChild(currentSVG);

  engine = new VisualObjectEngine(currentSVG);
  const menuZone = currentSVG.querySelector('[data-role="menu"]');
  const contentZone = currentSVG.querySelector('[data-role="content"]');
  const stickerZone = currentSVG.querySelector('[data-role="sticker"]');
  const actionZone = currentSVG.querySelector('[data-role="action"]');
  currentRegions.menu = menuZone;

  if (menuZone) engine.createMenuItem(menuZone, 'Familie-start', () => { appPreview.textContent = 'Familie-app geopend (voorbeeld).'; });
  if (contentZone) engine.registerObject(contentZone, 'content-zone', { label: 'Content', onClick: () => { appPreview.textContent = 'Content-zone geactiveerd.'; } });
  if (stickerZone) engine.registerObject(stickerZone, 'sticker-zone', { label: 'Sticker', onClick: () => makeSticker(stickerZone) });
  if (actionZone) engine.registerObject(actionZone, 'action', { label: 'Actie', onClick: () => { appPreview.textContent = 'Actie uitgevoerd.'; } });

  userSpace.addMedia({ id: `media-${Date.now()}`, name: file.name, size: file.size, at: Date.now() });
  renderArchive();
  status(`SVG-oppervlak met ${engine.objects.length} bedienbare objecten.`);
});

function makeSticker(zoneEl) {
  const meta = zoneEl
    ? { x: +zoneEl.getAttribute('x'), y: +zoneEl.getAttribute('y'), w: +zoneEl.getAttribute('width'), h: +zoneEl.getAttribute('height'), theme: zoneEl.getAttribute('data-theme') || 'family' }
    : { x: 100, y: 200, w: 300, h: 150, theme: 'family' };
  const sticker = stickerEngine.createStickerFromRegion(meta);
  if (currentSVG) currentSVG.appendChild(stickerEngine.toSVG(sticker));
  userSpace.addSticker({ id: sticker.id, theme: sticker.theme, at: sticker.createdAt });
  renderArchive();
  appPreview.textContent = `Sticker gemaakt (${sticker.theme}) ${sticker.style.emoji}`;
}

$('btn-sticker').addEventListener('click', () => makeSticker(currentRegions.menu));

$('btn-save-app').addEventListener('click', () => {
  const app = { id: `app-${Date.now()}`, name: 'Beeld-app', objects: engine ? engine.objects.length : 0, createdAt: Date.now() };
  userSpace.addApp(app);
  renderArchive();
  status(`App bewaard: ${app.name} (${app.objects} objecten).`);
});

$('btn-clear').addEventListener('click', () => {
  userSpace.clearAll();
  renderArchive();
  status('User-space gewist.');
});
