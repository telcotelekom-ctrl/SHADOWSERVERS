# Handbuch – Nutzung und Entwicklung

## Ziel dieses Handbuchs

Dieses Handbuch beschreibt die Nutzung der Hauptmodule und die sinnvolle Weiterentwicklung von Finanziers01.

## Hauptmodule

### Portal
Öffne [index.html](index.html), um in die Hauptoberfläche zu gelangen.

### Business Suite
Die Business-Suite in [app/index.html](app/index.html) ist für Gründer und Unternehmensaufbau gedacht.

### Bewerbungssuite
Die Bewerbungssuite in [bewerbung.html](bewerbung.html) dient der Erstellung eines digitalen Profils oder Präsentationsauftritts.

### Runtime und API
Der lokale Server in [server/server.js](server/server.js) stellt die nötigen API-Funktionen bereit.

## Schnellstart für Entwickler

1. Projektordner öffnen
2. gewünschten Einstiegspunkt im Browser laden
3. bei API-Tests den lokalen Server starten
4. Änderungen schrittweise testen

Beispiel:

`ash
node server/server.js
`

## Empfohlene Arbeitsweise

- Änderungen klein und nachvollziehbar halten
- Frontend und Runtime getrennt testen
- bei Datenmodell-Änderungen die JSON- und SQL-Struktur mitdenken
- Dokumentation bei größeren Änderungen mitführen

## Nächste Entwicklungsrichtung

- gemeinsames Navigationssystem
- Founder Workspace
- Investor Cockpit
- MyOpenAI Partner Hub
- echte Backend-Integration
