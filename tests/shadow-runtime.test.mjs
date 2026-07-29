import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeAdapter } from '../shadow/runtime-adapter.js';

test('runtime adapter bootstraps without Node-specific dependencies', () => {
  const runtime = createRuntimeAdapter({ adapter: 'browser', capabilities: ['browser', 'webcrypto'] });
  const bootstrap = runtime.bootstrap();
  assert.equal(bootstrap.adapter, 'browser');
  assert.ok(bootstrap.protocol.identity.id.includes('shadow'));
  assert.ok(bootstrap.session.id.startsWith('session-'));
});
