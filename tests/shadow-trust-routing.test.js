const test = require('node:test');
const assert = require('node:assert/strict');

test('shadow kernel includes trust graph and semantic route', async () => {
  const mod = await import('../shadow/kernel.js');
  const api = await mod.startShadowOS();

  assert.ok(api.inbox.payload.payload.trustGraph, 'trust graph should be present');
  assert.equal(api.inbox.payload.payload.trustGraph.trustScore > 0, true, 'trust score should be calculated');
  assert.equal(api.inbox.payload.payload.semanticRoute.strategy, 'semantic-routing-v1', 'semantic route should be attached');
});
