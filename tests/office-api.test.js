const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const repoRoot = path.resolve(__dirname, '..');
const port = 3101;
const dataFile = path.join(repoRoot, 'server', 'data', 'office-participations.json');

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

function postJson(pathname, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path: pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

test('office participation endpoint stores the user result', async () => {
  if (fs.existsSync(dataFile)) {
    fs.unlinkSync(dataFile);
  }

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

    const response = await postJson('/server/api/office/participation', {
      name: 'Test User',
      focus: 'AI & Systems',
      vision: 'Build a personal digital office',
      support: 'professional guidance'
    });

    assert.equal(response.statusCode, 200);
    const json = JSON.parse(response.body);
    assert.equal(json.success, true);
    assert.ok(fs.existsSync(dataFile));

    const stored = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    assert.ok(stored.some((entry) => entry.name === 'Test User'));

    const listResponse = await new Promise((resolve, reject) => {
      const req = http.get({ hostname: '127.0.0.1', port, path: '/server/api/office/participation' }, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });
      req.on('error', reject);
    });

    assert.equal(listResponse.statusCode, 200);
    const list = JSON.parse(listResponse.body);
    assert.equal(list.success, true);
    assert.ok(list.items.some((entry) => entry.name === 'Test User'));
  } finally {
    serverProcess.kill('SIGTERM');
  }
});
