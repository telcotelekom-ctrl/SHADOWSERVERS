# Premium-Dokumentation

Finanziers01 ist ein sichtbares Produkt- und Unternehmensportal auf einem **serverlosen
ShadowOS-Kern**. Das Node-Backend ist eine optionale lokale Erweiterung.

## Fokus
- Professioneller, statischer Portalauftritt (GitHub Pages-fähig).
- Serverloser, browser-nativer Kern (ShadowOS) als eigentliches Produkt.
- Optionale Live-Erweiterungen: Companion- und Status-Updates über ein lokales Backend.
- Klare Dokumentationsstruktur inkl. Architektur-Manifest.

## Kernpunkte
- [index.html](index.html) ist der sichtbare Einstieg; ShadowOS bootet im Browser.
- [shadow/](shadow) enthält den serverlosen Kern (`startShadowOS()`).
- [server/server.js](server/server.js) ist ein OPTIONALES lokales Backend; [server/data](server/data) dessen Daten.
- [MANIFEST_SHADOWOS.md](MANIFEST_SHADOWOS.md) / [shadowos-manifest.html](shadowos-manifest.html) beschreiben die Vision.
- [university-deploy](university-deploy) ist die deploybare Live-Kopie (Pages).

## Betriebsstatus
- Kern: serverloses ShadowOS, browser-nativ.
- Portal: statisch, live auf GitHub Pages.
- Node-Backend: optional, nur lokal.