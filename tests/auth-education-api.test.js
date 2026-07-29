const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const repoRoot = path.resolve(__dirname, '..');
const port = 3102;
const usersFile = path.join(repoRoot, 'server', 'data', 'users.json');
const sessionsFile = path.join(repoRoot, 'server', 'data', 'sessions.json');
const educationFile = path.join(repoRoot, 'server', 'data', 'education-interests.json');

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
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function getJson(pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ hostname: '127.0.0.1', port, path: pathname }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
  });
}

test('auth registration and education interest flow work end-to-end', async () => {
  for (const filePath of [usersFile, sessionsFile, educationFile]) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
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

    const registerResponse = await postJson('/server/auth/register', {
      name: 'Test User',
      email: `auth-education-${Date.now()}@example.com`,
      password: 'testpassword123'
    });

    assert.equal(registerResponse.statusCode, 201);
    const registerJson = JSON.parse(registerResponse.body);
    assert.equal(registerJson.success, true);
    assert.ok(registerJson.token);
    assert.ok(fs.existsSync(usersFile));

    const loginResponse = await postJson('/server/auth/login', {
      email: registerJson.user.email,
      password: 'testpassword123'
    });

    assert.equal(loginResponse.statusCode, 200);
    const loginJson = JSON.parse(loginResponse.body);
    assert.equal(loginJson.success, true);
    assert.ok(loginJson.token);

    const interestResponse = await postJson('/server/api/education/interest', {
      name: 'Test Student',
      email: 'student@example.com',
      level: 'weiterbildung',
      fields: ['Künstliche Intelligenz', 'Webentwicklung'],
      message: 'I want to learn more about the platform.'
    });

    assert.equal(interestResponse.statusCode, 201);
    const interestJson = JSON.parse(interestResponse.body);
    assert.equal(interestJson.success, true);
    assert.equal(interestJson.interest.name, 'Test Student');

    const listResponse = await getJson('/server/api/education/interest');
    assert.equal(listResponse.statusCode, 200);
    const listJson = JSON.parse(listResponse.body);
    assert.equal(listJson.success, true);
    assert.ok(listJson.items.some((entry) => entry.name === 'Test Student'));
  } finally {
    serverProcess.kill('SIGTERM');
  }
});
