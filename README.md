# SHADOWPORTAL – aktuelle Dokumentation

Dieses Repository ist jetzt auf ein sichtbares Hauptportal und eine zentrale Shadow-Runtime ausgerichtet. Die Hauptoberfläche liegt in [index.html](index.html), während die Live-Funktionalität über [server/server.js](server/server.js) bereitgestellt wird.

## Aktueller Aufbau
- Hauptportal: [index.html](index.html)
- Shadow-Runtime: [server/server.js](server/server.js)
- Companion- und WebSocket-Layer: [server/server.js](server/server.js)
- App-Einstieg: [app/index.html](app/index.html)
- Legacy-Referenz: [legacy/index.html](legacy/index.html)
- Deploy-Variante: [university-deploy/index.html](university-deploy/index.html)

## Verifizierte Kernrouten
- /api/health
- /api/status
- /api/companion-updates
- /api/portfolio/findings
- /api/profiles
- /ws/companion

## Arbeitsweise
1. Öffne das Hauptportal über [index.html](index.html).
2. Stelle sicher, dass die Shadow-Runtime über [server/server.js](server/server.js) erreichbar ist.
3. Prüfe die Health-Route über /api/health.
4. Nutze die Companion- und Portfolio-Routen für Live-Inhalte.

## Wichtig
- Die sichtbare Portaloberfläche ist der primäre Einstieg.
- Die Shadow-Runtime ist die autoritative Backend-Schicht.
- Legacy- und alte Public-HTML-Pfade sind nur noch Referenz, nicht der Hauptweg.

## Aktueller Betriebsstatus
- Hauptportal: sichtbar und direkt erreichbar über [index.html](index.html)
- Runtime: aktiv über [server/server.js](server/server.js)
- Health-Check: /api/health
- Companion-Livekanal: /ws/companion
- Status- und Portfolio-Routen: /api/status, /api/portfolio/findings