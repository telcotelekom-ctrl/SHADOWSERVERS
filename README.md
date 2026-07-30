# SHADOWPORTAL – Dokumentation

Dieses Repository verbindet ein sichtbares, statisches Hauptportal mit einem
**serverlosen, browser-nativen Kern (ShadowOS)**. Ein optionales Node-Backend liefert
zusätzliche Live-Funktionen, ist aber nicht erforderlich, damit das System läuft.

## Architektur in drei Schichten
1. **Portal (statisch, Browser):** [index.html](index.html) + Unterseiten. Läuft ohne Server,
   lauffähig auf GitHub Pages.
2. **ShadowOS – der serverlose Kern:** ES-Module in [shadow/](shadow), geladen via
   `import { startShadowOS } from './shadow/kernel.js'`. Nutzt WebCrypto (ECDSA P-256),
   einen WASM-Kernel im Browser-Adapter und localStorage-Discovery. **Kein Node nötig.**
3. **Node-Backend (OPTIONAL, lokal):** [server/server.js](server/server.js) für erweiterte
   Live-Features (Companion, Status, Profile, Portfolio). Das Portal erkennt es automatisch
   und arbeitet ohne es sauber im Offline-/Shadow-Modus weiter.

## Manifest
- Architektur-Manifest: [MANIFEST_SHADOWOS.md](MANIFEST_SHADOWOS.md) /
  Portal-Seite [shadowos-manifest.html](shadowos-manifest.html) (SHADOWOS Ω∞).

## Optionale Node-Routen (nur bei lokal laufendem server/server.js)
- /api/health, /api/status, /api/companion-updates, /api/portfolio/findings, /api/profiles, /ws/companion

## Deployment (zwei Repos)
- **telcotelekom-ctrl/SHADOWSERVERS** – vollständiges Projekt inkl. `shadow/`, Assets, Tests.
- **telcotelekom-ctrl/university** – statische Live-Kopie für GitHub Pages.
  Live: https://telcotelekom-ctrl.github.io/university/
- `.nojekyll` sorgt dafür, dass `shadow/` und `.mjs`-Dateien ausgeliefert werden.

## Arbeitsweise
1. Öffne [index.html](index.html) (lokal oder über Pages) – ShadowOS bootet im Browser.
2. Für erweiterte Live-Features optional das Node-Backend lokal starten (siehe [server/README.md](server/README.md)).
3. Legacy-/alte Public-HTML-Pfade ([legacy/](legacy)) sind nur Referenz.

## Betriebsstatus
- Kern: serverloses ShadowOS, browser-nativ, ohne Node lauffähig.
- Portal: statisch, live auf GitHub Pages.
- Node-Backend: optional, nur lokal.