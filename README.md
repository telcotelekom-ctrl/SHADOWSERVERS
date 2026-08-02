# SHADOWPORTAL – Dokumentation

Dieses Repository verbindet ein sichtbares, statisches Hauptportal mit einem
**serverlosen, browser-nativen Kern (ShadowOS)**. Ein optionales Node-Backend liefert
zusätzliche Live-Funktionen, ist aber nicht erforderlich, damit das System läuft.

## Architektur in drei Schichten
1. **Portal (statisch, Browser):** [index.html](index.html) + Unterseiten. Läuft ohne Server,
   lauffähig auf GitHub Pages und spricht die Runtime-, Member- und Dokumentationslayer an.
2. **ShadowOS – der serverlose Kern:** ES-Module in [shadow/](shadow), geladen via
   `import { startShadowOS } from './shadow/kernel.js'`. Nutzt WebCrypto (ECDSA P-256),
   einen WASM-Kernel im Browser-Adapter, localStorage-Discovery und eine Erweiterungsanalyse
   für Layer wie Identity, Workspace, Knowledge, Service und Universe. **Kein Node nötig.**
3. **Node-Backend (OPTIONAL, lokal):** [server/server.js](server/server.js) für erweiterte
   Live-Features (Companion, Status, Profile, Portfolio). Das Portal erkennt es automatisch
   und arbeitet ohne es sauber im Offline-/Shadow-Modus weiter.

## Universal Visual Runtime (UVR) – Produktivsoftware
Kein Demo, sondern echte Fabrikations-Standardsoftware. Grundsatz:
**„Alles ist ein Objekt. Alles ist eine Regel. Alles andere erzeugt die Runtime."**
- Engine: [shadow/uvr-runtime.js](shadow/uvr-runtime.js) mit `UniversalVisualRuntime`,
  `createUvrManifest()`, `createUvrSummary()` und `adaptWordPressToUVR()`.
- Objektmodell: Objekt + Regel + Szene. Renderer-Auswahl automatisch zwischen
  `html` (DOM vorhanden) und `text` (Node/Fallback) – hardware- und OS-übergreifend kompatibel.
- Produktions-Manifest: [shadow/portal.vos.json](shadow/portal.vos.json) (`.vos`-Format,
  Manifest `myopenai.portal`, Hardware-Targets desktop/mobile/tv/terminal/vr/legacy).
- Portal-Integration: Sektion **„UVR Runtime"** in [index.html](index.html) mit echtem
  `.vos`-Import (Upload → Parse → Render) und `.vos`-Export (Download des aktiven Manifests).
- Vision-Seite: [final-cut.html](final-cut.html) – In-N-Out Volume Economy mit funktionierender
  Wertfunktion `calculateValue(secondsSince2025, multiplier=0.1)`.
- Gesamtsystem: [finaly-all.html](finaly-all.html) – FINALY ALL (Bildung, Inventur, Organisation,
  Sprachen, Altersgruppen, Erkenntnis, Wahrheit) mit Curriculum-Generator, Inventur-Checkliste
  und JSON-Datenmodell.
- Developer-Bereich: [developer-universum.html](developer-universum.html) – SERVICESOFTWARE TEL1.NL,
  28 Programmiersprachen level-schaltbar (Dummy→Experte) mit `localStorage`-Speicherung von Name
  und Level, mehrsprachiger Live-Playground (JavaScript echt ausführbar, andere Sprachen als
  Ausgabe-Simulation), Konzept-Übersetzer, Snippet-Bibliothek (kopierbare Bausteine),
  Developer-Curriculum (level-gerechter Lernpfad), Fortschritts-Tracker (gelernte Sprachen/Konzepte
  mit Fortschrittsbalken), Code-/AI-Hilfen, Developer-A–Z und JSON-Architektur.
- Developer-Manifest: [developer-manifest.html](developer-manifest.html) – Präambel, 8 Artikel,
  Code-Standard und JSON-Modell, signiert von Raymond Demitrio Tel (SERVICESOFTWARE · TEL1.NL).
- Universale Suche: [suche.html](suche.html) – client-seitige Suche über die gesamte Struktur
  (Index [search/search-index.json](search/search-index.json), Engine [search/search-engine.js](search/search-engine.js)).
  Web-Worker-Pipeline (off-main-thread), Vorhersage/Autocomplete, Tippfehler-Toleranz (Levenshtein),
  Bezugs-/Vergleichsworte, Kategorie-Filter und Fallback-Anfrageformular. **Massentauglich:**
  kein zentraler DB-Server → kein Flaschenhals, unbegrenzt skalierbar via CDN, jeder Browser ist ein Such-Knoten.

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
2. Nutze die Image-App unter [imageapp/index.html](imageapp/index.html) für semantische Bildanalyse,
   Produktionseinstellungen wie Hintergrundwahl, transparentes Logo und Filmstil sowie
   die Verbindung zur ShadowOS-Wabenmatrix.
3. Nutze [VisualRuntime/index.html](VisualRuntime/index.html) für die cinematic runtime mit
   Director-Controls, Logo- und Film-Atmosphäre sowie einem Produktions-Setup.
4. Für erweiterte Live-Features optional das Node-Backend lokal starten (siehe [server/README.md](server/README.md)).
5. Legacy-/alte Public-HTML-Pfade ([legacy/](legacy)) sind nur Referenz.

## Betriebsstatus
- Kern: serverloses ShadowOS, browser-nativ, ohne Node lauffähig.
- Portal: statisch, live auf GitHub Pages und durch einen premium orientierten Member-/Workspace-Flow ergänzt.
- Image- und Visual-Layer: konfigurierbar über Hintergrund, transparentes Logo und Filmstil.
- Extension-Discovery: beschreibt die Plattform als Layer-Stack aus Identity, Workspace, Knowledge, Service und Universe.
- Node-Backend: optional, nur lokal.