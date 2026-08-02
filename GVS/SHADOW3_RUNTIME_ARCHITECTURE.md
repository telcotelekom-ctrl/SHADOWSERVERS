# GVS / Shadow³ Runtime Architecture

Diese Datei übersetzt die Plattformvision in eine für Entwickler umsetzbare Architektur, die zum bestehenden Repository passt.

## Grundprinzip

Das eigentliche Produkt ist die Runtime selbst. Anwendungen, Webseiten, Dokumentationen, Medien, KI-Assistenz und Workspaces sind Module derselben Umgebung.

Die aktuelle Basis des Repositories ist bereits stark in diese Richtung ausgerichtet:

- ein sichtbares Portal in [index.html](../index.html)
- ein browser-nativer Kern in [shadow/](../shadow)
- ein optionales lokales Backend in [server/](../server)

## Zielarchitektur

### 1. Shadow³ Runtime Core

Die Runtime besteht nicht nur aus einem Renderer, sondern aus einem vollständigen Betriebssystem-ähnlichen Kern:

- Kernel
- Visual Engine
- Animation Engine
- Knowledge Engine
- Timeline Engine
- Workspace Engine
- Project Engine
- Package Manager
- Security Engine
- AI Engine
- Synchronization Engine

### 2. Formula Engine

Formeln werden als zentrale Abstraktion behandelt:

- Formula
- Geometry
- Animation
- Physics
- Logic
- Knowledge
- Rendering
- Automation

Damit können Inhalte, Prozesse und Interaktionen über dieselbe semantische Schicht gesteuert werden.

### 3. Motion Engine

Bewegung wird nicht nur als Video behandelt, sondern als strukturierte Szene:

- Movement
- Emotion
- Scene
- Camera
- Light
- Transition

Diese Schicht bildet die Basis für Animation, Präsentation, Storytelling und interaktive Visualisierung.

### 4. Semantic Engine

Jedes Objekt besitzt eine eigene Semantik:

```json
{
  "id": "planet",
  "type": "knowledge",
  "emotion": "discovery",
  "links": ["science", "education", "space"]
}
```

Dabei werden Objekte nicht nur als Dateien oder Nodes behandelt, sondern als semantisch beschriebene Einheiten mit Beziehungen.

### 5. Studio Engine

Die Runtime enthält eine modulare Studio-Umgebung für:

- Video
- Audio
- SVG
- CAD
- Illustration
- Photography
- AI
- Publishing
- Streaming
- Podcast
- Animation
- Motion Graphics
- XR

### 6. Newsroom / Timeline

Der Content-Workflow wird als modulare Timeline aufgebaut:

- Timeline
- Clips
- Transitions
- Voice
- Titles
- Lower Thirds
- Live Feed
- Archive
- Export
- Publish

Jede Einheit ist ein Objekt, nicht nur eine Datei.

### 7. Nano Timeline

Für präzise Zeitsteuerung wird eine hochauflösende Zeitbasis verwendet:

- Project Clock
- Media Clock
- Playback Clock
- Render Clock

Video bleibt an Frames und Samples orientiert, die Runtime kann aber über eine feinere, systembasierte Zeitachse arbeiten.

## Plattform- und Betriebsmodelle

### PWA-first

Die Runtime wird zuerst als Progressive Web App gebaut:

- Install
- Offline
- Sync
- Cloud
- Share
- Collaborate

Danach kann dieselbe Codebasis für Desktop und Mobile verwendet werden.

### Distributed Nodes

Nicht nur ein einzelner Host, sondern ein Netzwerk von Knoten:

- Local Node
- Phone
- Tablet
- Mini PC
- Raspberry Pi
- NUC
- Server
- Laptop

Jeder Knoten kann als Host fungieren.

### Open Platform

Entwickler können Module hinzufügen:

- Marketplace
- Plugin
- Verification
- Install
- Runtime
- Update

## Modulstruktur

Die Runtime kann später folgende Module unterstützen:

- AI
- Video
- Office
- CAD
- Music
- Science
- Space
- Education
- Children
- Research
- Programming
- Publishing
- Security
- IoT
- Automation
- Robotics

## Umsetzung im bestehenden Repo

Das aktuelle Repository ist bereits ein guter Kern für diese Richtung:

1. Portal und Shell
   - [index.html](../index.html)
   - [portal.js](../portal.js)

2. Browser-native Runtime
   - [shadow/](../shadow)
   - [imageapp/](../imageapp)
   - [VisualRuntime/](../VisualRuntime)

3. Optionales lokales Backend
   - [server/](../server)
   - [server/server.js](../server/server.js)

4. Semantische und formale Basis
   - [server/formula-registry.js](../server/formula-registry.js)
   - [formel-registry.html](../formel-registry.html)

## Empfohlene Entwicklungsschritte

### Phase 1 – Runtime-Stabilisierung

- Portal- und Runtime-Boot sauber ausbauen
- Fehlerzustände sichtbar machen
- Offline- und Local-Context robustifizieren

### Phase 2 – Semantische Schicht

- Objektmodell für Knowledge-, Media- und Project-Entities einführen
- Struktur für Relations und Links schaffen
- Formel- und Rule-Registry ausbauen

### Phase 3 – Visual Workspace

- Timeline, Scene- und Motion-Modelle ergänzen
- SVG/Canvas/WebGPU als gemeinsame Render-Layer vorbereiten

### Phase 4 – Plugin- und PWA-Schicht

- Installations- und Update-Mechanik definieren
- Offline-/Sync-Modelle für lokale und cloudbasierte Nutzung ergänzen

### Phase 5 – Studio und AI

- AI-Assistenten, Publishing- und Export-Workflows einbauen
- Open-Plugin- und Marketplace-Mechanik vorbereiten

## Fazit

Die Richtung ist nicht „eine weitere App“, sondern ein plattformartiges Runtime-System. Das bestehende Repository kann als Kern dienen: Portal als Einstieg, ShadowOS als Browser-Runtime und Node-Backend als lokale Erweiterung. Aus dieser Basis lässt sich schrittweise eine echte GVS / Shadow³-Umgebung entwickeln.
