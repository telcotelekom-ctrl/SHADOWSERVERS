# Projektarchitektur – Shadow-Portal

Die Architektur ist klar gegliedert: sichtbares statisches Portal, serverloser ShadowOS-Kern
und ein optionales lokales Node-Backend.

## Komponenten
- **Portal (statisch):** [index.html](index.html) + Unterseiten – läuft ohne Server.
- **ShadowOS-Kern (serverlos, browser-nativ):** [shadow/](shadow), Boot über
  `startShadowOS()`. WebCrypto-Identität, WASM-Kernel (Browser-Adapter), localStorage-Discovery.
- **Node-Backend (OPTIONAL, lokal):** [server/server.js](server/server.js),
  Daten in [server/data](server/data).
- **App-Entry:** [app/index.html](app/index.html) · **Legacy-Referenz:** [legacy/index.html](legacy/index.html)

## Datenfluss
1. Das Portal bootet ShadowOS direkt im Browser (kein Server erforderlich).
2. ShadowOS verwaltet Identität, Krypto, Speicherung, Discovery und Module lokal.
3. Ist optional ein Node-Backend erreichbar, ergänzt es Live-Funktionen (Status, Companion, Profile).
4. Ohne Backend degradiert das Portal sauber in den Offline-/Shadow-Modus.

## Zielzustand
- Ein sichtbarer, konsistenter Portalauftritt.
- Ein serverloser ShadowOS-Kern als eigentliches Produkt (kein Node-Zwang).
- Ein optionales Backend nur dort, wo Live-Features lokal gewünscht sind.
- Klare Trennung zwischen Portal, Kern, optionalem Backend und Dokumentation.

## Betriebsstatus
- Kern: serverloses ShadowOS, browser-nativ.
- Portal: statisch, live auf GitHub Pages (telcotelekom-ctrl/university).
- Node-Backend: optional, nur lokal.