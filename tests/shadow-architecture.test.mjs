import test from 'node:test';
import assert from 'node:assert/strict';
import { createShadowSphereArchitecture } from '../shadow/snap-geometry.js';

test('shadow architecture bootstraps with geometry, fabric, visos and service layers', () => {
  const architecture = createShadowSphereArchitecture({ geometry: { core: { id: 'portal-core', label: 'Portal Core' } } });
  const bootstrap = architecture.bootstrap();
  assert.equal(bootstrap.protocol, 'Shadow Protocol Ω∞');
  assert.ok(bootstrap.geometry.shellCount >= 3);
  assert.ok(bootstrap.fabric.routes.length === 0);
  assert.ok(bootstrap.visos.mode === 'adaptive');
  assert.ok(bootstrap.services.storage.active);
});
