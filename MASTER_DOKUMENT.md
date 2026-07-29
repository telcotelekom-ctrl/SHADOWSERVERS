# Master-Dokumentation

Die aktuelle Projektstruktur ist auf ein zentrales Portal und eine Shadow-Runtime ausgerichtet. Das Root-Portal in [index.html](index.html) ist die Hauptansicht, während [server/server.js](server/server.js) die operative Logik und die Live-API bereitstellt.

## 1. Sichtbare Ebene
- [index.html](index.html) als Hauptportal
- [app/index.html](app/index.html) als App-Startpunkt
- [legacy/index.html](legacy/index.html) als Referenzstruktur

## 2. Runtime-Ebene
- [server/server.js](server/server.js) für API-, Companion- und WebSocket-Funktionalität
- [server/data](server/data) für lokale Zustände und Inhalte

## 3. Dokumentationsstruktur
- Root-Dokumente beschreiben den aktuellen Portal- und Runtime-Stand.
- Unterordner wie [university-deploy](university-deploy) spiegeln die public-facing Variante wider.

## 4. Nutzung
- Öffne [index.html](index.html) für die Hauptansicht.
- Prüfe /api/health, /api/status und /ws/companion.

## Aktueller Betriebsstatus
- Hauptportal: sichtbar und direkt erreichbar über [index.html](index.html)
- Runtime: aktiv über [server/server.js](server/server.js)
- Health-Check: /api/health
- Companion-Livekanal: /ws/companion
- Status- und Portfolio-Routen: /api/status, /api/portfolio/findings