# Root-Code-Report

Die aktuelle Basis ist ein sichtbares Portal mit Live-API-Unterstützung und einer Shadow-Runtime als zentraler Schicht.

## Status
- Hauptportal: [index.html](index.html)
- Runtime: [server/server.js](server/server.js)
- Companion: /ws/companion
- Health-Check: /api/health

## Erkenntnis
Die aktuelle Frontend-Schicht ist nun direkt an die Runtime gekoppelt. Legacy- und alte Einstiegspfade sind nicht mehr der primäre Pfad.

## Aktueller Betriebsstatus
- Hauptportal: sichtbar und direkt erreichbar über [index.html](index.html)
- Runtime: aktiv über [server/server.js](server/server.js)
- Health-Check: /api/health
- Companion-Livekanal: /ws/companion
- Status- und Portfolio-Routen: /api/status, /api/portfolio/findings