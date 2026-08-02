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

## 2b. Universal Visual Runtime (UVR) – Produktivsoftware
- Grundsatz: **„Alles ist ein Objekt. Alles ist eine Regel. Alles andere erzeugt die Runtime."**
- Engine: [shadow/uvr-runtime.js](shadow/uvr-runtime.js) mit `UniversalVisualRuntime`,
  `createUvrManifest()`, `createUvrSummary()`, `adaptWordPressToUVR()`.
- Produktions-Manifest: [shadow/portal.vos.json](shadow/portal.vos.json) im `.vos`-Format
  (Manifest `myopenai.portal`, Hardware-Targets desktop/mobile/tv/terminal/vr/legacy).
- Portal-Sektion **„UVR Runtime"** in [index.html](index.html) mit echtem `.vos`-Import
  und `.vos`-Export. Renderer-Auswahl automatisch (`html`/`text`) – OS- und hardwareübergreifend.
- Vision-Seite: [final-cut.html](final-cut.html) (In-N-Out Volume Economy, funktionierende Wertfunktion).
- Gesamtsystem: [finaly-all.html](finaly-all.html) (FINALY ALL: Bildung, Inventur, Sprachen,
  Altersgruppen, Curriculum-Generator, JSON-Datenmodell).
- Developer-Bereich: [developer-universum.html](developer-universum.html) (SERVICESOFTWARE TEL1.NL) –
  28 Sprachen level-schaltbar mit `localStorage`-Speicherung, mehrsprachiger Live-Playground
  (JavaScript echt, andere simuliert), Konzept-Übersetzer, Snippet-Bibliothek, Developer-Curriculum
  und Fortschritts-Tracker.
- Developer-Manifest: [developer-manifest.html](developer-manifest.html) (Präambel, 8 Artikel,
  Code-Standard, signiert von Raymond Demitrio Tel).
- Universale Suche: [suche.html](suche.html) – client-seitige Suchmaschine über die gesamte
  Struktur mit Web-Worker-Pipeline, Vorhersage, Tippfehler-Toleranz, Bezugsworten und Fallback.
  Massentauglich ohne DB-Server-Flaschenhals (CDN, ein Such-Knoten pro Browser).
- Kein Demo: echte Fabrikations-Standardsoftware.

## 3. Optionale Backend-Ebene (nur lokal)
- [server/server.js](server/server.js) für API-, Companion- und WebSocket-Funktionalität
- [server/data](server/data) für lokale Zustände und Inhalte
- Portal degradiert ohne Backend sauber in den Offline-/Shadow-Modus.

## 4. Manifest & Dokumentation
- [MANIFEST_SHADOWOS.md](MANIFEST_SHADOWOS.md) / [shadowos-manifest.html](shadowos-manifest.html) (SHADOWOS Ω∞).
- [university-deploy](university-deploy) spiegelt die public-facing Live-Variante (GitHub Pages).
- [GVS/GVS_SHADOWSPHERE_OVERVIEW.md](GVS/GVS_SHADOWSPHERE_OVERVIEW.md) ist der zentrale Ueberblick
	fuer GVS, ShadowSphere, VISOS/VERYL und die neue Identity-Cell-Integration.
- [GVS/SEARCH_LOG.md](GVS/SEARCH_LOG.md) fuehrt Such- und Research-Referenzen als kompaktes Log.
- [GVS/knowledge-db/index.html](GVS/knowledge-db/index.html) ist das visuelle Dashboard der zentralen Knowledge DB.
- [GVS/start.html](GVS/start.html) ist die gemeinsame Startoberflaeche fuer TELADIA, H2O SUN,
  Branding, Knowledge DB, Play Zone und Standby-Zugang.
- [GVS/knowledge-db/records/db.json](GVS/knowledge-db/records/db.json) enthaelt die persistierten Kernrecords.
- [GVS/knowledge-db/schema.json](GVS/knowledge-db/schema.json) definiert Tabellen und Feldstrukturen.
- [GVS/H2O_SUN_BUBBLE_UNIVERSE.md](GVS/H2O_SUN_BUBBLE_UNIVERSE.md) beschreibt Leitbild,
	Produktionslogik und Director's-Cut-Phasen.
- [GVS/h2o-sun-bubble-universe.html](GVS/h2o-sun-bubble-universe.html) stellt das Konzept
	als interaktive Runtime-Seite dar.
- [GVS/BRANDING_MANIFEST.md](GVS/BRANDING_MANIFEST.md) fuehrt den Branding-Titel
	"One Idea. Infinite Possibilities." als Orientierungssatz.
- [GVS/branding-manifest.html](GVS/branding-manifest.html) zeigt das Branding als kleine Runtime-Seite.
- [GVS/TELADIA_FINAL_CORE.md](GVS/TELADIA_FINAL_CORE.md) ist die definitive Signatur-, Film-
	und Weltkern-Referenz.
- [GVS/teladia-final-core.html](GVS/teladia-final-core.html) zeigt die TELADIA-Signatur als interaktive Runtime.
- [GVS/TELADIA_VALUE_AND_PAYMENT_HINT.md](GVS/TELADIA_VALUE_AND_PAYMENT_HINT.md) fuehrt
	Wertlogik, Play Zone und den Informationshinweis vor dem Zahlungslink zusammen.
- [GVS/teladia-value-and-payment-hint.html](GVS/teladia-value-and-payment-hint.html) zeigt die Wert- und Zahlungsseite.
- [GVS/ALL_ALSO_HUB.md](GVS/ALL_ALSO_HUB.md) ist der zentrale Sammelindex fuer alle aktuellen GVS/TELADIA-Pfade.
- [GVS/all-also-hub.html](GVS/all-also-hub.html) ist die interaktive Hub-Seite.
- [GVS/XSTOX_METAMASK_STANDBY.md](GVS/XSTOX_METAMASK_STANDBY.md) beschreibt die signierte,
  read-only MetaMask/XSTOX-Standby-Schicht mit Mock-Aktionen.
- [GVS/xstox-metamask-standby.html](GVS/xstox-metamask-standby.html) ist die interaktive Standby-Seite.
- [GVS/TNT_TRUST_BOARD.md](GVS/TNT_TRUST_BOARD.md) beschreibt Regeln und Scope des spielbaren T.&.T.-Trust-Boards.
- [GVS/tnt-trust-board.html](GVS/tnt-trust-board.html) ist die laufende Browser-Spielseite der Play Zone.
- [GVS/ERNSTFALL_KORREKTUR_CENTER.md](GVS/ERNSTFALL_KORREKTUR_CENTER.md) beschreibt den Ernstfall-Modus fuer Korrekturarbeiten und automatische Fehlersuche.
- [GVS/ernstfall-korrektur-center.html](GVS/ernstfall-korrektur-center.html) ist die ausfuehrbare Diagnose- und Korrekturhilfe ohne Entpacken.
- [GVS/UHAIOS_ARCHITECTURE_SPEC.md](GVS/UHAIOS_ARCHITECTURE_SPEC.md) enthaelt die technische Spezifikation fuer das Universal Human AI Operating System.
- [GVS/brand-signe-gallery.html](GVS/brand-signe-gallery.html) brandet die vorhandenen Bilder mit BRANDSIGNE und International-Call-Center-Kennung.

## 5. Identitaet & User-Zusatz im Portal
- Das Hauptportal fuehrt eine sichtbare Identity Cell als Zusatz zur Nutzeridentitaet.
- Diese Zone verbindet Kontaktinformationen, Initiator-Kontext und Dokumentationspfade.
- Ziel: transparente Zuordnung zwischen Mensch, Runtime und Wissensstruktur.

## 6. Nutzung
- Öffne [index.html](index.html); ShadowOS bootet im Browser.
- Optional das lokale Node-Backend starten, um /api/health, /api/status und /ws/companion zu nutzen.

## Betriebsstatus
- Kern: serverloses ShadowOS, browser-nativ.
- Portal: statisch, live auf GitHub Pages.
- Node-Backend: optional, nur lokal.