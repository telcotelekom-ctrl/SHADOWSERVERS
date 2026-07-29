const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const http = require('node:http');

const repoRoot = path.resolve(__dirname, '..');
const port = 3111;

function waitForServer(url, timeoutMs = 5000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error('Server start timed out'));
          return;
        }
        setTimeout(tryConnect, 100);
      });
    };
    tryConnect();
  });
}

function requestJson(method, pathname, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : undefined;
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: pathname,
      method,
      headers: body ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      } : undefined
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

test('shadow runtime exposes the expected compatibility API routes', async () => {
  const serverProcess = spawn(process.execPath, ['server/server.js'], {
    cwd: repoRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  serverProcess.stdout.on('data', (chunk) => { output += chunk.toString(); });
  serverProcess.stderr.on('data', (chunk) => { output += chunk.toString(); });

  try {
    await waitForServer(`http://127.0.0.1:${port}/server/api/health`);

    const health = await requestJson('GET', '/api/health');
    assert.equal(health.statusCode, 200);
    const healthJson = JSON.parse(health.body);
    assert.equal(healthJson.ok, true);
    assert.equal(healthJson.runtime, 'shadow-os');

    const status = await requestJson('GET', '/api/status');
    assert.equal(status.statusCode, 200);
    const statusJson = JSON.parse(status.body);
    assert.equal(statusJson.ok, true);
    assert.equal(statusJson.runtime, 'shadow-os');

    const manifest = await requestJson('GET', '/api/manifest/list');
    assert.equal(manifest.statusCode, 200);
    const manifestJson = JSON.parse(manifest.body);
    assert.ok(Array.isArray(manifestJson.items));

    const manifestSync = await requestJson('POST', '/api/manifest/sync', { id: 'portal', title: 'Portal', status: 'active' });
    assert.equal(manifestSync.statusCode, 200);
    const manifestSyncJson = JSON.parse(manifestSync.body);
    assert.equal(manifestSyncJson.success, true);

    const messages = await requestJson('GET', '/api/messages');
    assert.equal(messages.statusCode, 200);
    const messagesJson = JSON.parse(messages.body);
    assert.ok(Array.isArray(messagesJson.items));

    const companionUpdates = await requestJson('GET', '/api/companion-updates');
    assert.equal(companionUpdates.statusCode, 200);
    const companionUpdatesJson = JSON.parse(companionUpdates.body);
    assert.ok(Array.isArray(companionUpdatesJson.items));

    const portfolioFindings = await requestJson('GET', '/api/portfolio/findings');
    assert.equal(portfolioFindings.statusCode, 200);
    const portfolioFindingsJson = JSON.parse(portfolioFindings.body);
    assert.ok(Array.isArray(portfolioFindingsJson.items));

    const submit = await requestJson('POST', '/api/submit', { message: 'hello shadow' });
    assert.equal(submit.statusCode, 200);
    const submitJson = JSON.parse(submit.body);
    assert.equal(submitJson.success, true);

    const contacts = await requestJson('GET', '/api/contacts');
    assert.equal(contacts.statusCode, 200);
    const contactsJson = JSON.parse(contacts.body);
    assert.ok(Array.isArray(contactsJson.items));

    const chats = await requestJson('GET', '/api/chats');
    assert.equal(chats.statusCode, 200);
    const chatsJson = JSON.parse(chats.body);
    assert.ok(Array.isArray(chatsJson.items));
  } finally {
    serverProcess.kill('SIGTERM');
  }
});
