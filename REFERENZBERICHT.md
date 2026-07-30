# Referenzbericht – Finanziers01 / ShadowServer

Stand: 2026-07-30. Erstellt nach vollständiger Lektüre aller Dokumentation (inkl. Unterordner).
Dieser Bericht ist die Referenz VOR weiteren Codeänderungen.

## 1. Gelesene Dokumentation (alle .md)
Root: `README.md`, `PROJECT_ARCHITECTURE_ROOT.md`, `MASTER_DOKUMENT.md`, `PREMIUM_DOKUMENTATION.md`,
`EXPANSION_PLAN.md`, `ROOT_CODE_REPORT.md`, `SHADOWOS_PRODUCT_VISION.md`, `HANDBUCH_NUTZUNG.md`,
`BEDIENUNGSANLEITUNG_ENDNUTZER.md`.
Unterordner: `server/README.md`, `server/SERVER_DOCUMENTATION.md`, `app/serverB/README.md`.
Duplikate (ignoriert, nicht Quelle): `university-deploy/*.md`, `legacy/app/serverB/README.md`.

### Einheitliche Kernaussage der Docs
- Portal = `index.html` (sichtbare Oberfläche, Haupteinstieg).
- "Runtime" = `server/server.js` (Node HTTP+WS Backend).
- Daten = `server/data/`.
- Routen: `/api/health`, `/api/status`, `/api/companion-updates`, `/api/portfolio/findings`,
  `/api/profiles`, `/ws/companion`.
- Deploy-Variante = `university-deploy/`; `legacy/` = reine Referenz.

### Wichtiger Widerspruch
Die Docs bezeichnen `server/server.js` als "Single Source of Truth / aktiven Kern" (alte Node-Framing).
Das widerspricht der Projektvorgabe, dass der Kern SERVERLOS ist (browser-natives ShadowOS in `shadow/`).
=> Die Docs sind gegenüber dem realen ShadowOS-Kern veraltet. Node ist optional/lokal.

## 2. Aktuelle Architektur (3 Schichten)
1. **Portal (statisch, Browser):** `index.html` + Unterseiten. Läuft ohne Server.
2. **ShadowOS ("ShadowServer", serverlos):** `shadow/*.js` ES-Module, geladen via
   `<script type="module">` → `startShadowOS()`. WebCrypto (ECDSA P-256), WASM-Kernel
   (adapter `browser`), localStorage-Discovery. KEIN Node nötig.
3. **Node-Backend (OPTIONAL, lokal):** `server/server.js`. Nur lokal erreichbar (127.0.0.1).

## 3. Deployment-Status
| Repo | Remote | Pages | Status |
|---|---|---|---|
| Root | `telcotelekom-ctrl/SHADOWSERVERS` | `/SHADOWSERVERS/` | committet+gepusht, `.nojekyll` gesetzt, **Aktivierung durch Nutzer** |
| `university-deploy/` | `telcotelekom-ctrl/university` | `/university/` | **LIVE (200)**, shadow/ + assets/ enthalten |

Verifiziert live (university): `index`, `shadow/kernel.js`, `shadow/portal-bridge.mjs`,
`assets/logo.svg`, `app/serverB/index.html` → alle HTTP 200.

## 4. Offenes Problem (Konsolenfehler online)
Beim Aufruf über GitHub Pages erscheinen viele Fehler:
- `127.0.0.1:3000/api/health` → `ERR_CONNECTION_REFUSED`
- `api/health` (relativ) → `404`
- `Could not restore application state from Server B`
- `Companion panel could not connect to runtime`

**Ursache:** `resolveApiBase()` in `index.html` sucht online weiterhin den optionalen Node-Server.
Es probt `127.0.0.1:3000/3005` und `window.location.origin`, und fällt am Ende IMMER auf
`PRIMARY_ORIGIN = http://127.0.0.1:3000` zurück. Alle folgenden Aufrufe
(`/api/profiles`, `/api/status`, `/api/companion-updates`) laufen dann gegen localhost und scheitern.

**Wichtig:** Das ShadowOS selbst (`startShadowOS`) läuft unabhängig davon. Es ist NICHT offline —
nur die optionale Node-API ist online nicht vorhanden, und die Fehlermeldungen erwecken den Eindruck.

## 5. Plan (noch NICHT ausgeführt)
1. In `index.html` einen Remote-Host-Check einführen:
   `hostname ∉ {localhost, 127.0.0.1, [::1]}` und `protocol ≠ file:` → Online-/Offline-Modus.
2. Online: Node-Discovery komplett überspringen (kein `127.0.0.1`-Probe), `resolveApiBase()` gibt
   `null` zurück statt `PRIMARY_ORIGIN`.
3. Alle fetch-Aufrufer früh in den Offline-Fallback leiten, wenn keine API-Basis vorhanden ist:
   `runCalculation` (~1737), `runCalculationWithQuery` (~1762), profiles-POST (~1980),
   `loadApplicationState` (~1997), `initCompanionPanel` (~2128), status (~2217).
4. Ergebnis: Keine Konsolenfehler mehr online; ShadowOS + Offline-Rechner + statische Inhalte laufen sauber.
5. Änderung in Root committen/pushen (SHADOWSERVERS) und nach `university-deploy` spiegeln + pushen.

## 6. Manueller Schritt (nur Nutzer)
GitHub Pages für `SHADOWSERVERS` aktivieren: Settings → Pages → Deploy from a branch → `main` /root.
Der Agent kann Pages nicht per API aktivieren (kein Token/gh CLI).
