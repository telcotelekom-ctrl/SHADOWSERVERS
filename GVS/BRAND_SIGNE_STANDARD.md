# BRANDSIGNE STANDARD (GLOBAL)

## Ziel

Dieser Standard setzt Picture Branding als durchgaengige Systemregel:

- fuer bestehende Bilder
- fuer neue Bilder
- fuer spaeter dynamisch geladene Bilder

## Signatur

- `.signe:+31-613-803-782.-`
- `INTERNATIONAL-CALL-CENTER EOCEUROPEAN OFFICE ORGANISATION'S I,.`

## Technische Regel

1. Jede Seite bindet `assets/brand-signe-standard.js` ein.
2. Jedes `img`-Element wird beim Laden automatisch markiert.
3. Dynamisch hinzugefuegte Bilder werden via MutationObserver ebenfalls automatisch markiert.
4. Audit ist ueber `window.BrandSigneStandard.runAudit()` abrufbar.

## Pflichtfelder

- `alt`-Text sollte gesetzt sein.
- `data-brand-signe-applied=true` wird automatisch vergeben.
- `data-brand-signe` und `data-brand-organisation` werden gesetzt.

## Betrieb

- Local-first kompatibel
- Browser-only lauffaehig
- ohne Entpacken lesbar

## Governance

- Branding darf keine medizinischen oder operativen Fachdaten veraendern.
- Branding ist rein visuelle und organisatorische Identitaetsschicht.
- Audit-Ergebnisse sind nachvollziehbar und zeitgestempelt.
