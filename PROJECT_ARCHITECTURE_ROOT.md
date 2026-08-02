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
- **GVS/ShadowSphere-Dokumentation:** [GVS/GVS_SHADOWSPHERE_OVERVIEW.md](GVS/GVS_SHADOWSPHERE_OVERVIEW.md)
  + [GVS/SEARCH_LOG.md](GVS/SEARCH_LOG.md)
- **Universal Visual Runtime (UVR):** [shadow/uvr-runtime.js](shadow/uvr-runtime.js) +
  Produktions-Manifest [shadow/portal.vos.json](shadow/portal.vos.json) – echte Produktivsoftware
  (kein Demo). Objekt/Regel/Szene-Modell mit `.vos`-Import/-Export im Portal und automatischer
  Renderer-Auswahl (`html`/`text`) für OS- und hardwareübergreifende Kompatibilität.
- **Vision & Bildung:** [final-cut.html](final-cut.html) (Volume Economy),
  [finaly-all.html](finaly-all.html) (FINALY ALL Gesamtsystem).
- **Developer-Domäne (SERVICESOFTWARE TEL1.NL):** [developer-universum.html](developer-universum.html) –
  28 Sprachen level-schaltbar mit `localStorage`-Profil, mehrsprachiger Live-Playground,
  Konzept-Übersetzer, Snippet-Bibliothek, Developer-Curriculum und Fortschritts-Tracker;
  [developer-manifest.html](developer-manifest.html) – Manifest von Raymond Demitrio Tel.
- **Universale Suche:** [suche.html](suche.html) + [search/search-engine.js](search/search-engine.js)
  + [search/search-index.json](search/search-index.json) – client-seitige Suchmaschine über die
  gesamte Struktur. Web-Worker-Pipeline (off-main-thread), Fuzzy-/Vorhersage-Logik, Bezugsworte,
  Fallback-Formular. Skaliert unbegrenzt bei Massenlast (CDN, kein zentraler DB-Server).

## Datenfluss
1. Das Portal bootet ShadowOS direkt im Browser (kein Server erforderlich).
2. ShadowOS verwaltet Identität, Krypto, Speicherung, Discovery und Module lokal.
3. Ist optional ein Node-Backend erreichbar, ergänzt es Live-Funktionen (Status, Companion, Profile).
4. Ohne Backend degradiert das Portal sauber in den Offline-/Shadow-Modus.

## Zielzustand
- Ein sichtbarer, konsistenter Portalauftritt mit Member-, Workspace- und Service-Interaktion.
- Ein serverloser ShadowOS-Kern als eigentliches Produkt (kein Node-Zwang).
- Ein optionales Backend nur dort, wo Live-Features lokal gewünscht sind.
- Klare Trennung zwischen Portal, Kern, optionalem Backend und Dokumentation.
- Eine gekoppelte Identity-Cell im Portal als Bruecke zwischen Nutzeridentitaet,
  Initiatorprofil und Runtime-/Dokumentationslage.
- Ein produktiver Image-/Visual-Layer mit konfigurierbaren Production-Settings und einer
  generellen Extension-Discovery für Identity-, Workspace-, Knowledge-, Service- und Universe-Layer.

## Betriebsstatus
- Kern: serverloses ShadowOS, browser-nativ.
- Portal: statisch, live auf GitHub Pages (telcotelekom-ctrl/university).
- Node-Backend: optional, nur lokal.