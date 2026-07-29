const test = require('node:test');
const assert = require('node:assert/strict');

test('shadow kernel boots with ai, semantic, relay fabric and protocol envelope', async () => {
  const mod = await import('../shadow/kernel.js');
  const api = await mod.startShadowOS();

  assert.ok(api.identityPub, 'identity should be created');
  assert.equal(api.state.ready, true, 'kernel state should be ready');
  assert.equal(api.semanticObject.type, 'kernel', 'semantic object should be attached');
  assert.ok(api.inbox.payload, 'signed envelope should contain the protocol payload');
  assert.equal(api.inbox.payload.payload.relayFabric.relayCount, 1, 'relay fabric should expose one active relay');
  assert.ok(api.inbox.payload.payload.insight.summary, 'insight should be generated');
});
