# Server-Dokumentation (OPTIONAL)

Dieses Node-Backend ist eine **optionale, lokale** Erweiterung. Es ist NICHT der Kern des
Projekts – der Kern ist das serverlose, browser-native ShadowOS ([../shadow](../shadow),
Boot über `startShadowOS()`). Das Backend wird über [server.js](server.js) bereitgestellt und
von [../index.html](../index.html) automatisch erkannt, wenn es lokal läuft.

## Bestandteile
- API-Routen für Health, Status, Profile und Portfolio
- Companion- und WebSocket-Integration
- Datenpersistenz im Ordner [data](data)

## Nutzung
- Öffne das Portal in [../index.html](../index.html) (ShadowOS läuft auch ohne dieses Backend).
- Zum Aktivieren der Live-Features: `node server.js` starten und /api/health prüfen.