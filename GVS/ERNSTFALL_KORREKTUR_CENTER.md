# GVS Ernstfall Korrektur Center

## Zweck

Diese Seite liefert einen ernsthaften Betriebsmodus fuer Korrekturarbeiten, automatische Fehlersuche und nachvollziehbare Nacharbeit.

- Direkt auslesbar ohne Entpacken
- Keine ZIP-Pflicht
- Lesbare Reports als TXT und JSON
- Automatische Hilfetexte pro Fehlerklasse

## Runtime

- Seite: `GVS/ernstfall-korrektur-center.html`
- Browserbasiert, kein Node-Zwang
- Prueft HTTP-Erreichbarkeit zentraler Seiten und Kern-Dokumente
- Prueft Struktur in `GVS/knowledge-db/records/db.json`

## Gepruefte Zielpfade

- `GVS/start.html`
- `GVS/all-also-hub.html`
- `GVS/tnt-trust-board.html`
- `GVS/xstox-metamask-standby.html`
- `GVS/knowledge-db/index.html`
- `GVS/knowledge-db/records/db.json`
- `index.html`
- `MASTER_DOKUMENT.md`

## Fehlersuche und Korrekturhilfe

Die Seite klassifiziert Findings in:

- `ok`
- `warn`
- `error`

Jedes Finding enthaelt:

- Severity
- Code
- Target
- Message
- Automatic Help

## Export

- `gvs-ernstfall-report.txt`
- `gvs-ernstfall-report.json`

Beide Exporte sind direkt lesbar und fuer Korrekturarbeiten geeignet.

## Grenzen

- Es werden keine produktiven Geldtransaktionen ausgefuehrt.
- Die Seite nimmt keine unkontrollierten Datei-Aenderungen vor.
- Korrekturen bleiben nachvollziehbar und manuell steuerbar.
