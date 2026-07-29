# Server-Dokumentation

Die Runtime ist die zentrale Logikschicht des Projekts. Sie wird über [server.js](server.js) bereitgestellt und von [../index.html](../index.html) verwendet.

## Bestandteile
- API-Routen für Health, Status, Profile und Portfolio
- Companion- und WebSocket-Integration
- Datenpersistenz im Ordner [data](data)

## Nutzung
- Öffne das Portal in [../index.html](../index.html)
- Prüfe die API über /api/health