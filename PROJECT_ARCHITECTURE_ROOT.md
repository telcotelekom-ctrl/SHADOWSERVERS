# Projektarchitektur – Shadow-Portal

Die Architektur ist jetzt klar gegliedert: Sichtbare Oberfläche, Shadow-Runtime und Datenebene.

## Komponenten
- Portal: [index.html](index.html)
- Runtime: [server/server.js](server/server.js)
- Daten: [server/data](server/data)
- App-Entry: [app/index.html](app/index.html)
- Legacy-Referenz: [legacy/index.html](legacy/index.html)

## Datenfluss
1. Das Portal ruft die Runtime-API auf.
2. Die Runtime liefert Health-, Status-, Companion- und Profilinformationen.
3. Die UI stellt diese Daten sichtbar und interaktiv dar.

## Zielzustand
- Ein sichtbarer, konsistenter Portalauftritt
- Eine operative Shadow-Runtime als Single Source of Truth
- Eine klare Trennung zwischen Portal, Runtime und Dokumentation

## Aktueller Betriebsstatus
- Hauptportal: sichtbar und direkt erreichbar über [index.html](index.html)
- Runtime: aktiv über [server/server.js](server/server.js)
- Health-Check: /api/health
- Companion-Livekanal: /ws/companion
- Status- und Portfolio-Routen: /api/status, /api/portfolio/findings