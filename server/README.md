# Server-Runtime (OPTIONAL, lokal)

Dieses Node-Backend ist **optional**. Der eigentliche Produktkern ist serverlos und läuft
browser-nativ als ShadowOS (siehe [../shadow](../shadow) und [../index.html](../index.html)).
Das Backend ergänzt nur lokale Live-Features.

## Hauptaufgaben (nur wenn gestartet)
- Health- und Status-Endpunkte
- Companion- und WebSocket-Funktionalität
- Portfolio- und Profil-API
- Datenverwaltung über [data](data)

## Einstieg (optional)
- Ausführen über Node.js: `node server.js` (siehe [server.js](server.js))
- Prüfen mit /api/health
- Ohne dieses Backend arbeitet das Portal im Offline-/Shadow-Modus weiter.