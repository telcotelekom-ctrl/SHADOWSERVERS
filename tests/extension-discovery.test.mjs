import test from 'node:test';
import assert from 'node:assert/strict';
import { createExtensionDiscoveryEngine } from '../shadow/extension-discovery.js';

test('suggests compatible extensions for an SVG editor module', () => {
  const engine = createExtensionDiscoveryEngine(['visual-runtime', 'knowledge-engine']);
  const result = engine.analyzeModule('svg-editor');

  assert.equal(result.moduleId, 'svg-editor');
  assert.ok(result.suggestions.length >= 4);
  assert.ok(result.suggestions.some((suggestion) => suggestion.id === 'animation-package'));
  assert.ok(result.suggestions.some((suggestion) => suggestion.id === 'webgpu-renderer'));
});

test('returns a richer layer-based analysis for the identity layer', () => {
  const engine = createExtensionDiscoveryEngine(['visual-runtime', 'knowledge-engine', 'studio-engine']);
  const result = engine.analyzeModule('identity');

  assert.equal(result.moduleId, 'identity');
  assert.equal(result.layer, 'Identity Layer');
  assert.equal(result.hostStrategy, 'Hybrid');
  assert.ok(result.suggestions.some((suggestion) => suggestion.id === 'profile-hub'));
  assert.ok(result.summary.includes('identity'));
});

test('returns a neutral analysis for an unknown runtime module', () => {
  const engine = createExtensionDiscoveryEngine(['visual-runtime']);
  const result = engine.analyzeModule('unknown-module');

  assert.equal(result.moduleId, 'unknown-module');
  assert.equal(result.suggestions.length, 0);
  assert.deepEqual(result.missingCapabilities, []);
});

test('returns a catalogue for the full platform stack', () => {
  const engine = createExtensionDiscoveryEngine(['visual-runtime', 'knowledge-engine']);
  const catalogue = engine.analyzeLayerCatalogue();

  assert.ok(catalogue.length >= 8);
  assert.ok(catalogue.some((entry) => entry.moduleId === 'knowledge'));
  assert.ok(catalogue.some((entry) => entry.moduleId === 'universe'));
});
