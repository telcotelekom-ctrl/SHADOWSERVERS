# Architektur-Root – Finanziers01

## Ziel

Die Plattform ist als mehrschichtige, browserbasierte Produktarchitektur angelegt. Sie dient gleichzeitig als sichtbare Oberfläche, als Produktprototype und als technische Blaupause für spätere Backend- und Hosting-Integration.

## Hauptschichten

### Präsentation
- [index.html](index.html)
- [bewerbung.html](bewerbung.html)
- [app/index.html](app/index.html)

### Applikationslogik
- [portal.js](portal.js)
- [style.css](style.css)
- interne Skript- und State-Logik der Seiten

### Runtime und API
- [server/server.js](server/server.js)
- [server/data](server/data)
- [server/db/schema.sql](server/db/schema.sql)

### Dokumentations- und Produktstruktur
- [MASTER_DOKUMENT.md](MASTER_DOKUMENT.md)
- [ROOT_CODE_REPORT.md](ROOT_CODE_REPORT.md)
- [HANDBUCH_NUTZUNG.md](HANDBUCH_NUTZUNG.md)

## Aktueller Status

Die Architektur ist flexibel, lokal startbar und gut für die frühe Produktphase geeignet. Offen sind noch echte Datenbankintegration, vollständige Auth- und Rollenlogik sowie eine konsolidierte Produkt-Shell.

## Zukunftsstruktur

- gemeinsame Navigation für alle Module
- einheitliches Design-System
- eigene Produktseiten für Workspace, Investor und MyOpenAI
- zentrale API- und Datenlogik
