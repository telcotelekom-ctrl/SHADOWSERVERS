// Service worker for "Your Image to App" (scope = ./imageapp/).
// Offline-first app shell, versioned cache, and one-click uninstall via message.
// All paths are RELATIVE so it works under a project sub-path (e.g. /university/imageapp/).
const CACHE_NAME = 'image-app-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest',
  './visual-object-engine.js',
  './image-to-svg.js',
  './sticker-engine.js',
  './user-space.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // addAll is atomic; ignore individual 404s during dev by mapping to Promise.allSettled.
      .then((cache) => Promise.allSettled(APP_SHELL.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        // Runtime-cache same-origin GETs so new files become available offline.
        if (resp.ok && new URL(req.url).origin === self.location.origin) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});

// One-click uninstall: unregister + purge all caches.
self.addEventListener('message', (event) => {
  if (event.data === 'UNREGISTER_SW') {
    self.registration.unregister()
      .then(() => caches.keys())
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((c) => c.postMessage('SW_UNREGISTERED')));
  }
});
