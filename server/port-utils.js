const net = require('node:net');

async function checkPortAvailable(port, host = '127.0.0.1') {
  return await new Promise((resolve) => {
    const tester = net.createServer();
    tester.once('error', () => resolve(false));
    tester.once('listening', () => {
      tester.once('close', () => resolve(true));
      tester.close();
    });
    tester.listen(port, host);
  });
}

async function findAvailablePort(startPort, host = '127.0.0.1', maxAttempts = 10) {
  let port = Number(startPort);
  if (!Number.isInteger(port) || port < 1) {
    port = 3000;
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const available = await checkPortAvailable(port, host);
    if (available) {
      return port;
    }
    port += 1;
  }

  throw new Error(`No available port found starting from ${startPort}`);
}

module.exports = { checkPortAvailable, findAvailablePort };
