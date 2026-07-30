# Master-Dokumentation

Die Projektstruktur besteht aus einem zentralen statischen Portal, einem serverlosen
ShadowOS-Kern und einem optionalen lokalen Node-Backend.

## 1. Sichtbare Ebene (statisch)
- [index.html](index.html) als Hauptportal
- [app/index.html](app/index.html) als App-Startpunkt
- [legacy/index.html](legacy/index.html) als Referenzstruktur

## 2. Kern-Ebene (serverlos)
- [shadow/](shadow) – ShadowOS-Module, Boot über `startShadowOS()`.
- Browser-nativ: WebCrypto-Identität, WASM-Kernel (Browser-Adapter), localStorage-Discovery.
- Kein Node erforderlich; lauffähig auf GitHub Pages.

## 3. Optionale Backend-Ebene (nur lokal)
- [server/server.js](server/server.js) für API-, Companion- und WebSocket-Funktionalität
- [server/data](server/data) für lokale Zustände und Inhalte
- Portal degradiert ohne Backend sauber in den Offline-/Shadow-Modus.

## 4. Manifest & Dokumentation
- [MANIFEST_SHADOWOS.md](MANIFEST_SHADOWOS.md) / [shadowos-manifest.html](shadowos-manifest.html) (SHADOWOS Ω∞).
- [university-deploy](university-deploy) spiegelt die public-facing Live-Variante (GitHub Pages).

## 5. Nutzung
- Öffne [index.html](index.html); ShadowOS bootet im Browser.
- Optional das lokale Node-Backend starten, um /api/health, /api/status und /ws/companion zu nutzen.

## Betriebsstatus
- Kern: serverloses ShadowOS, browser-nativ.
- Portal: statisch, live auf GitHub Pages.
- Node-Backend: optional, nur lokal.