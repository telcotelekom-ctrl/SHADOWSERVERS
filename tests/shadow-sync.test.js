const test = require('node:test');
const assert = require('node:assert/strict');

test('shadow kernel creates sync session and broadcast payload', async () => {
  const mod = await import('../shadow/kernel.js');
  const api = await mod.startShadowOS();

  assert.ok(api.inbox.payload.payload.sync, 'sync payload should be created');
  assert.ok(api.inbox.payload.payload.broadcast, 'broadcast payload should be created');
  assert.equal(api.inbox.payload.payload.sync.payload.state.lastMode, 'shadow-os', 'sync session should contain state delta');
});
