# SHADOWSERVERS
SERVER'S SERVICESES'S

## Überblick

Finanziers01 ist ein browserbasiertes Produkt- und Unternehmenssystem mit mehreren sichtbaren Modulen, einem lokalen Runtime-Layer und einer klaren Dokumentationsstruktur. Ziel ist es, aus dem aktuellen Portal eine echte, erweiterbare Plattform für Unternehmen, Projekte, Bewerbungen und Partnerschaften zu machen.

## Hauptmodule

- Portal und Einstieg
- Business- und Founder-Workflow
- Bewerbung und Profilstruktur
- Investor- und Rechenbereich
- lokaler Server mit API-Funktionalität
- ShadowOS-Runtime und sichtbare Statusausgabe
- Dokumentations- und Produktstruktur

## Schnellstart

### Direkt im Browser
1. Öffne [index.html](index.html).
2. Nutze die Navigation zu den wichtigsten Bereichen.
3. Prüfe Inhalte, Vorschau oder Exportfunktionen.

### Investor Portal und Angebote
Das zentrale Portal ist unter der öffentlichen URL [Investor Portal - Startup Systems | Z-Canvas Kapitalformeln](https://telcotelekom-ctrl.github.io/university/) erreichbar.

Es bündelt folgende Angebotsbereiche:
- Investor-Kalkulator mit lokalen, globalen, Produktions- und Zeitindex-Berechnungen
- Bewerbungssuite und Profil-/Portfolio-Management
- Business Suite und Projekt-/Workspace-Ansichten
- Online Office, Dokumentation, Handbuch und Bedienungsanleitung
- PSY-TEL Studio und Hotspot-Funktionen für Live- und Broadcast-Szenarien
- CEOC-, Formel-Registry-, Physik- und MassEffect-Module

Der Aufbau ist bewusst so gestaltet, dass Nutzer sowohl schnelle Rechenlogik als auch strukturierte Produkt- und Netzwerkangebote in einem konsistenten Portal erleben.

### Mit lokalem Server
1. Öffne ein Terminal im Projektordner.
2. Starte den Server mit `node server/server.js`.
3. Öffne die lokale Adresse unter http://127.0.0.1:3000/.

### ShadowServer auf GitHub
Der Shadow-Server ist als eigenständiges Repository verfügbar unter [telcotelekom-ctrl/SHADOWSERVERS](https://github.com/telcotelekom-ctrl/SHADOWSERVERS).

Die Verbindung zwischen Portal und ShadowServer ist über die lokale Runtime und die API-Endpoints des Servers aufgebaut. Der Server stellt die Backend-Funktionalität bereit, während das Portal die sichtbare Oberfläche und die Nutzerinteraktion darstellt.

## Wichtige Dateien

- [index.html](index.html)
- [bewerbung.html](bewerbung.html)
- [app/index.html](app/index.html)
- [server/server.js](server/server.js)
- [server/port-utils.js](server/port-utils.js)
- [shadow/kernel.js](shadow/kernel.js)
- [MASTER_DOKUMENT.md](MASTER_DOKUMENT.md)
- [PROJECT_ARCHITECTURE_ROOT.md](PROJECT_ARCHITECTURE_ROOT.md)
- [ROOT_CODE_REPORT.md](ROOT_CODE_REPORT.md)
- [HANDBUCH_NUTZUNG.md](HANDBUCH_NUTZUNG.md)
- [BEDIENUNGSANLEITUNG_ENDNUTZER.md](BEDIENUNGSANLEITUNG_ENDNUTZER.md)

## Aktueller Status

Die Basis ist bereits gut strukturiert und nutzbar. Die aktuelle Phase umfasst eine sichtbare ShadowOS-Runtime, automatische Portfindung und eine erweiterte Backend-Integration.

## Nächste Schritte

- gemeinsame Navigation einführen
- Produktmodule konsolidieren
- echte Persistenz vorbereiten
- MyOpenAI als sichtbaren Partnerbereich ausbauen

## Premium-Dokumentation

Die vollständige Premium-Version mit Executive Summary, Produktvision, Roadmap und Deployment-Plan ist unter [PREMIUM_DOKUMENTATION.md](PREMIUM_DOKUMENTATION.md) verfügbar.
