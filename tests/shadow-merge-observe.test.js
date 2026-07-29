const test = require('node:test');
const assert = require('node:assert/strict');

test('shadow kernel exposes merge result and observability events', async () => {
  const mod = await import('../shadow/kernel.js');
  const api = await mod.startShadowOS();

  assert.ok(api.inbox.payload.payload.mergeResult, 'merge result should be present');
  assert.ok(api.inbox.payload.payload.observability.length, 'observability events should be recorded');
  assert.equal(api.inbox.payload.payload.mergeResult._v >= 1, true, 'merged state should have version info');
});
