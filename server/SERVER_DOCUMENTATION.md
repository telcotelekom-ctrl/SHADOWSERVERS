# Server-Dokumentation – Finanziers01/server

## Überblick

Der Ordner [server](.) enthält die lokale Runtime- und API-Schicht des Projekts. Er bündelt Server-Logik, Datenquellen, Konfiguration und verschiedene Produktmodule wie Auth, Investor-Rechner, Exchange, Formula-Registry, QR-Code, Spotify-Integration und PSY-TEL-Hotspot-Funktionen.

## Ziel des Servers

Der Server dient als lokale Runtime-Umgebung für:
- statische Inhalte und Legacy-Portal-Ansichten
- API-Endpunkte für Workspaces, Profile und Investor-Modelle
- Auth- und Session-Logik
- Produkt- und Integrationsmodule für verschiedene Bereiche des Systems

## Verzeichnisstruktur

- [server.js](server.js) – Haupt-Serverdatei mit der zentralen Runtime und Routen
- [ceoc.js](ceoc.js) – CEOC-/Unternehmenslogik
- [config-store.js](config-store.js) – Konfigurations- und Settings-Store
- [exchange.js](exchange.js) – Exchange-/Markt- oder Datenlogik
- [formula-registry.js](formula-registry.js) – Formel- und Rechenregister
- [mass-effect.js](mass-effect.js) – Mass-Effect-/Simulationslogik
- [protected.js](protected.js) – geschützte oder geschlossene Bereiche
- [qrcode.js](qrcode.js) – QR-Code-Funktionalität
- [spotify.js](spotify.js) – Spotify-Integration
- [data/](data) – JSON- und Datenquellen
- [db/](db) – Datenbank- und Schema-Dateien
- [package.json](package.json) – Paketdefinition und Abhängigkeiten
- [.env](.env) – lokale Umgebungskonfiguration
- [.env.example](.env.example) – Vorlagen-Datei für Umgebungsvariablen

## Zentrale Dateien im Detail

### [server.js](server.js)
Die Hauptdatei der Runtime. Sie stellt die Kern-Routen und Serverfunktionalität bereit, darunter:
- Health-Checks
- Auth- und Session-Endpoints
- Workspaces und Profiles
- Investor-Endpunkte
- Datei- und Legacy-Serving-Funktionalität

### [ceoc.js](ceoc.js)
Enthält CEOC-bezogene Logik und Module für Unternehmens- oder Organisationsstrukturen.

### [config-store.js](config-store.js)
Zentrale Konfigurationslogik für lokale Settings, Optionen und Runtime-Parameter.

### [exchange.js](exchange.js)
Exchange- oder Daten- und Marktlogik, passend zu den Produkt- und Portalmodulen.

### [formula-registry.js](formula-registry.js)
Registry für Formeln und Rechenelemente, insbesondere relevant für Investoren-, Produkt- oder Simulatoren.

### [mass-effect.js](mass-effect.js)
Enthält einen separaten Funktionsblock für Mass-Effect- oder Simulationslogik.

### [protected.js](protected.js)
Verwaltet geschützte Anwendungsbereiche oder geschützte Routen.

### [qrcode.js](qrcode.js)
Bietet QR-Code-bezogene Hilfsfunktionen.

### [spotify.js](spotify.js)
Bietet Spotify-Integration und Anbindung an Such- und Matching-Funktionalität.

## Datenordner

### [data/](data)
Speichert lokale JSON- oder strukturelle Datenquellen für Profile, Sessions, Workspaces, Kontakte und weitere Module.

### [db/](db)
Enthält Datenbank-Blueprints oder Schema-Dateien für spätere Persistenz und Migration.

## Konfiguration

Die Server-Umgebung wird über [.env](.env) oder [.env.example](.env.example) gesteuert.

Wichtige Variablen können unter anderem sein:
- PORT
- PSY_TEL_ACCESS_CODE
- SMTP-Parameter
- Spotify-Client-Variablen

## Lokaler Start

```bash
cd server
node server.js
```

Oder aus dem Projekt-Root:

```bash
node server/server.js
```

## Wichtige Routen und Bereiche

Der Server unterstützt typischerweise folgende Bereiche:
- Health-Checks
- Auth und Login
- Workspaces und Profile
- Investor-Rechnung
- Legacy- und Portal-Serving
- Hotspot- oder Broadcast-Funktionen
- QR-Code- und Spotify-Module

## Nutzungshinweise

- Für lokale Tests ist der Server als einfache Node.js-Runtime geeignet.
- Für echte Produktreife sollten Auth, Persistenz und Integrationen weiter ausgebaut werden.
- Sensible Werte sollten nie in Chat oder öffentlich geteilten Dateien erscheinen.

## Aktueller Entwicklungsstatus

Der Server ist bereits funktional als lokale Runtime und enthält mehrere Module für unterschiedliche Produktbereiche. Die nächste Stufe ist die Konsolidierung in eine einheitliche, sichere und robuste Produktarchitektur.
