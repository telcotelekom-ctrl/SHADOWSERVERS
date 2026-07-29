const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');
const { findAvailablePort } = require('../server/port-utils.js');

test('findAvailablePort chooses the next free port when the requested one is busy', async () => {
  const busyServer = net.createServer();
  await new Promise((resolve) => busyServer.listen(0, '127.0.0.1', resolve));
  const busyPort = busyServer.address().port;

  try {
    const discoveredPort = await findAvailablePort(busyPort, '127.0.0.1', 3);
    assert.notEqual(discoveredPort, busyPort);
    assert.ok(discoveredPort > 0);
  } finally {
    await new Promise((resolve) => busyServer.close(resolve));
  }
});
