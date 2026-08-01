# VisualRuntime — Director's Cut

Executable screenplay. Each chapter is implemented in [`js/director.js`](../js/director.js)
as an act that drives the engines as a function of its local progress `t` (0..1).

| # | Kapitel | Dauer | Was passiert (Engine-Wirkung) |
|---|---------|-------|-------------------------------|
| 01 | Genesis | 6s | Schwarz. Ein einzelner Lichtpunkt. `buildProgress ≈ 0`, hoher Glow. |
| 02 | Birth of the Sphere | 10s | Kugel baut sich Punkt für Punkt auf. `buildProgress: 0→1`. |
| 03 | Digital Consciousness | 10s | Punkte kommunizieren. Laser-Gitter erscheint (`laser.density 0→0.6`). |
| 04 | Portal Activation | 9s | TEL1/DIGITALNOTAR-Logo erscheint. `portal.active 0→1`, Zoom. |
| 05 | Knowledge Runtime | 12s | Radiales Menü entsteht (`menuVisible 0→1`), Daten fließen. |
| 06 | Ghost User | 10s | KI bewegt die Oberfläche selbst (`ghost = true`). |
| 07 | User Control | 9s | Benutzer übernimmt; Menü reagiert. |
| 08 | Portal Merge | 8s | Kugel verschmilzt mit dem Logo (`portal.merge 0→1`). |
| 09 | EGR | 10s | Explosion / Materialsimulation (`particles.dispersion`), Camera-Shake. |
| 10 | Universal Runtime | 12s | Alles lebt, Portal pulsiert endlos. |

## Runtime-Kette

```
Browser → Runtime → Director → (Particle · Laser · Portal · Menu · Audio) → Frame
```

## Steuerung (Director Panel)

Play / Pause / Restart · Timeline-Scrubbing · Kapitel-Sprung · Intensity ·
Particle Count · Laser Density · Bloom/Glow · Camera Spin · Ghost User · Audio.

## Technik

Browser-native, serverlos, ohne externe Bibliotheken: Canvas 2D, SVG, WebAudio,
`requestAnimationFrame`. WebGL/WebGPU-Shader (`shaders/`) sind für Phase 2 vorgesehen.

## Roadmap (Phasen)

1. **Phase 1 (fertig):** Runtime-Engine-Kette, Director's-Cut-Timeline, Partikel-Sphäre,
   Laser-Gitter, Portal, SVG-Menü, Regiepult, prozedurales Audio.
2. **Phase 2:** WebGL/WebGPU-Partikel + GLSL-Shader (`shaders/laser.glsl`, `glow.glsl`, `plasma.glsl`).
3. **Phase 3:** Erweiterte Timeline mit Audio-Spuren, Übergängen, HDR/Bloom-Postprocessing.
4. **Phase 4:** Wissenssystem + KI-Module, dynamisch generierte Inhalte (Kopplung an ShadowOS-Matrix).
5. **Phase 5:** Optimierung, PWA/Offline, GPU-Beschleunigung.
