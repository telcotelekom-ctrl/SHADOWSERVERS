import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPortalKernelContext, renderShadowKernelStatus } from '../shadow/portal-bridge.mjs';

test('buildPortalKernelContext captures workflow signals and kernel readiness', () => {
  const summary = {
    company: { name: 'Tel Horizon Systems', vision: 'Build clarity' },
    service: { name: 'Universal Company Builder' },
    operations: { process_name: 'Founder Flow' },
    contacts: { official_contacts: 'hello@tel-horizon.example' }
  };

  const context = buildPortalKernelContext(summary, { ready: true, bootedAt: '2026-07-29T00:00:00Z', _v: 3, identity: 'shadow-self' });

  assert.equal(context.active, true);
  assert.equal(context.companyName, 'Tel Horizon Systems');
  assert.deepEqual(context.signals, ['vision', 'offer', 'process', 'contact']);
  assert.equal(context.stateVersion, 3);
  assert.match(renderShadowKernelStatus(context), /Shadow Kernel Ω∞/);
});

test('renderShadowKernelStatus falls back to a neutral state when the kernel is not ready', () => {
  const context = buildPortalKernelContext({}, {});
  assert.equal(context.active, false);
  assert.equal(renderShadowKernelStatus(context), 'Shadow Kernel Ω∞ · initialisiert');
});
