# Root-Code-Report

Die Basis ist ein sichtbares statisches Portal mit einem serverlosen ShadowOS-Kern.
Ein Node-Backend kann optional lokal Live-Features ergänzen.

## Status
- Hauptportal: [index.html](index.html) (statisch)
- ShadowOS-Kern: [shadow/](shadow), Boot über `startShadowOS()`
- Optionales Backend: [server/server.js](server/server.js)
- Manifest: [MANIFEST_SHADOWOS.md](MANIFEST_SHADOWOS.md) / [shadowos-manifest.html](shadowos-manifest.html)

## Erkenntnis
- Der Kern läuft ohne Node direkt im Browser (GitHub Pages-fähig).
- Online-Fehlermeldungen zu 127.0.0.1/api entstehen nur durch die optionale Backend-Suche;
  sie betreffen nicht den ShadowOS-Kern (siehe [REFERENZBERICHT.md](REFERENZBERICHT.md)).
- Legacy-/alte Einstiegspfade sind nur Referenz.

## Betriebsstatus
- Kern: serverloses ShadowOS, browser-nativ.
- Portal: statisch, live auf GitHub Pages.
- Node-Backend: optional, nur lokal.