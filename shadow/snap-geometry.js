import { createShadowGeometry } from './geometry.js';
import { createShadowFabric } from './fabric.js';
import { createVisosEngine } from './visos.js';
import { createVerylEngine } from './veryl.js';
import { createShadowServerServices } from './services.js';

export function createShadowSphereArchitecture(options = {}) {
  const geometry = createShadowGeometry(options.geometry || {});
  const visos = createVisosEngine(options.visos || {});
  const veryl = createVerylEngine(options.veryl || {});
  const services = createShadowServerServices(options.services || {});
  const fabric = createShadowFabric(geometry, {
    getSnapshot() {
      return {
        positions: Object.fromEntries(geometry.nodes.map((node) => [node.id, { layer: node.layer || 1, role: node.role || 'node' }]))
      };
    }
  });

  return {
    geometry,
    fabric,
    visos,
    veryl,
    services,
    bootstrap() {
      return {
        protocol: 'Shadow Protocol Ω∞',
        geometry: geometry.getSnapshot(),
        fabric: fabric.getSnapshot(),
        visos: visos.getSnapshot(),
        veryl: veryl.getSnapshot(),
        services: services.getSnapshot()
      };
    }
  };
}
