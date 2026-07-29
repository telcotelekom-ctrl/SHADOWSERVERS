const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const workspacesFile = path.join(dataDir, 'workspaces.json');
const profilesFile = path.join(dataDir, 'profiles.json');
const investorFile = path.join(dataDir, 'investor.json');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken() {
  return crypto.randomBytes(20).toString('hex');
}

function ensureSeedData() {
  ensureDir(dataDir);

  const users = loadJson(usersFile, []);
  if (!users.length) {
    users.push({
      id: 'user-raymond',
      name: 'Raymond Demitrio Tel',
      email: 'raymond@serverb.local',
      role: 'admin',
      passwordHash: hashPassword('serverb2026'),
      createdAt: new Date().toISOString()
    });
    saveJson(usersFile, users);
  }

  const sessions = loadJson(sessionsFile, []);
  saveJson(sessionsFile, sessions);

  const workspaces = loadJson(workspacesFile, []);
  if (!workspaces.length) {
    workspaces.push({
      id: 'workspace-demo',
      title: 'Demo Workspace',
      owner: 'raymond@serverb.local',
      createdAt: new Date().toISOString(),
      data: {
        company: 'TEL Horizon Systems',
        stage: 'shadow-runtime'
      }
    });
    saveJson(workspacesFile, workspaces);
  }

  const profiles = loadJson(profilesFile, []);
  if (!profiles.length) {
    profiles.push({
      id: 'profile-demo',
      applicantName: 'Raymond Demitrio Tel',
      applicantRole: 'Digital Creator & Systems Builder',
      applicantFocus: 'Portfolio, Bewerbung und digitale Präsenz',
      mediaType: 'Text',
      mediaLink: 'https://digitalnotar.in',
      createdAt: new Date().toISOString()
    });
    saveJson(profilesFile, profiles);
  }

  const investorData = loadJson(investorFile, []);
  if (!investorData.length) {
    investorData.push({
      id: 'calc-demo',
      name: 'Shadow Demo',
      payload: {
        local: {
          N: 10000,
          f: 5000,
          p: 0.1,
          I_avg: 10000,
          m: 0.2,
          u: 0.8,
          K_fix: 50000,
          N_employees: 10
        }
      },
      createdAt: new Date().toISOString()
    });
    saveJson(investorFile, investorData);
  }
}

function sendJson(res, payload, statusCode = 200) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, payload, statusCode = 200, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(payload);
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8'
  };
  return map[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    sendText(res, 'Not Found', 404);
    return;
  }

  const stat = fs.statSync(filePath);
  if (stat.isDirectory()) {
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      serveFile(res, indexPath);
      return;
    }
    sendText(res, 'Directory listing is disabled', 403);
    return;
  }

  const content = fs.readFileSync(filePath);
  sendText(res, content.toString('utf8'), 200, getMimeType(filePath));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function getAuthenticatedUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return null;
  }

  const sessions = loadJson(sessionsFile, []);
  const session = sessions.find((item) => item.token === token);
  if (!session) {
    return null;
  }

  const users = loadJson(usersFile, []);
  const user = users.find((item) => item.id === session.userId);
  return user ? { user, session } : null;
}

function buildInvestorResult(type, payload) {
  switch (type) {
    case 'local':
      return {
        capital_base: payload.N * payload.f * payload.p * payload.I_avg,
        automation_adjustment: (1 + payload.u) * (1 - payload.m),
        net_capital_flow: payload.N * payload.f * payload.p * payload.I_avg * (1 + payload.u) * (1 - payload.m) - payload.K_fix,
        employee_capacity: payload.N / Math.max(1, payload.N_employees),
        scenario_note: 'shadow runtime using server b fallback'
      };
    case 'global':
      return {
        free_capacity: payload.BPP_global * payload.F_free_rate * payload.alpha_0 * Math.max(1, payload.N_employees),
        employee_factor: payload.N_employees,
        scenario_note: 'shadow runtime using server b fallback'
      };
    case 'production':
      return {
        direct_cost: payload.production_cost_base * payload.mass_capital_factor,
        time_cost: payload.product_time_hours * payload.time_cost_rate * payload.productivity_rate,
        total_cost: payload.production_cost_base * payload.mass_capital_factor + payload.product_time_hours * payload.time_cost_rate * payload.productivity_rate,
        scenario_note: 'shadow runtime using server b fallback'
      };
    case 'time-index':
      return {
        efficiency_ratio: payload.productive_time_hours / Math.max(1, payload.total_time_invested_hours),
        time_index_value: payload.productive_time_hours / Math.max(1, payload.total_time_invested_hours) * payload.time_value_rate,
        scenario_note: 'shadow runtime using server b fallback'
      };
    case 'complete':
      return {
        local_net_capital_flow: payload.local.N * payload.local.f * payload.local.p * payload.local.I_avg * (1 + payload.local.u) * (1 - payload.local.m) - payload.local.K_fix,
        global_free_capacity: payload.global.BPP_global * payload.global.F_free_rate * payload.global.alpha_0 * Math.max(1, payload.local.N_employees),
        production_total_cost: payload.production.production_cost_base * payload.production.mass_capital_factor + payload.production.product_time_hours * payload.production.time_cost_rate * payload.production.productivity_rate,
        time_index_value: payload.production.productivity_rate * payload.local.N_employees,
        scenario_name: payload.name || 'Unbenanntes Szenario'
      };
    default:
      return { status: 'unknown' };
  }
}

ensureSeedData();

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1:3000'}`);
  const pathname = decodeURIComponent(requestUrl.pathname);

  if (req.method === 'OPTIONS') {
    sendText(res, '', 204);
    return;
  }

  if (pathname === '/server/api/health') {
    sendJson(res, { ok: true, runtime: 'server-b', timestamp: new Date().toISOString() });
    return;
  }

  if (pathname === '/server/auth/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const users = loadJson(usersFile, []);
      const user = users.find((item) => item.email === body.email && item.passwordHash === hashPassword(body.password || ''));
      if (!user) {
        sendJson(res, { success: false, error: 'Invalid credentials' }, 401);
        return;
      }

      const sessions = loadJson(sessionsFile, []);
      const token = createToken();
      sessions.push({
        id: `session-${Date.now()}`,
        token,
        userId: user.id,
        createdAt: new Date().toISOString()
      });
      saveJson(sessionsFile, sessions);

      sendJson(res, {
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      sendJson(res, { success: false, error: 'Invalid JSON body' }, 400);
    }
    return;
  }

  if (pathname === '/server/auth/me' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      sendJson(res, { success: false, error: 'Unauthorized' }, 401);
      return;
    }

    sendJson(res, {
      success: true,
      user: {
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role
      }
    });
    return;
  }

  if (pathname === '/server/auth/logout' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      sendJson(res, { success: false, error: 'Unauthorized' }, 401);
      return;
    }

    const sessions = loadJson(sessionsFile, []);
    const filtered = sessions.filter((item) => item.token !== auth.session.token);
    saveJson(sessionsFile, filtered);
    sendJson(res, { success: true, message: 'Session removed' });
    return;
  }

  if (pathname === '/server/api/investor/local' && req.method === 'POST') {
    const payload = await readJsonBody(req);
    sendJson(res, { success: true, result: buildInvestorResult('local', payload) });
    return;
  }

  if (pathname === '/server/api/investor/global' && req.method === 'POST') {
    const payload = await readJsonBody(req);
    sendJson(res, { success: true, result: buildInvestorResult('global', payload) });
    return;
  }

  if (pathname === '/server/api/investor/production' && req.method === 'POST') {
    const payload = await readJsonBody(req);
    sendJson(res, { success: true, result: buildInvestorResult('production', payload) });
    return;
  }

  if (pathname === '/server/api/investor/time-index' && req.method === 'POST') {
    const payload = await readJsonBody(req);
    sendJson(res, { success: true, result: buildInvestorResult('time-index', payload) });
    return;
  }

  if (pathname === '/server/api/investor/complete' && req.method === 'POST') {
    const payload = await readJsonBody(req);
    const record = {
      id: `calc-${Date.now()}`,
      name: payload.name || 'Shadow Scenario',
      payload,
      createdAt: new Date().toISOString()
    };
    const items = loadJson(investorFile, []);
    items.push(record);
    saveJson(investorFile, items);

    sendJson(res, { success: true, result: buildInvestorResult('complete', payload) });
    return;
  }

  if (pathname === '/server/api/workspaces' && req.method === 'GET') {
    const workspaces = loadJson(workspacesFile, []);
    sendJson(res, { success: true, items: workspaces });
    return;
  }

  if (pathname === '/server/api/workspaces' && req.method === 'POST') {
    const payload = await readJsonBody(req);
    const workspaces = loadJson(workspacesFile, []);
    const record = {
      id: payload.id || `workspace-${Date.now()}`,
      title: payload.title || 'Workspace',
      owner: payload.owner || 'anonymous',
      createdAt: new Date().toISOString(),
      data: payload.data || {}
    };
    workspaces.push(record);
    saveJson(workspacesFile, workspaces);
    sendJson(res, { success: true, workspace: record });
    return;
  }

  if (pathname === '/server/api/profiles' && req.method === 'GET') {
    const profiles = loadJson(profilesFile, []);
    sendJson(res, { success: true, items: profiles });
    return;
  }

  if (pathname === '/server/api/profiles' && req.method === 'POST') {
    const payload = await readJsonBody(req);
    const profiles = loadJson(profilesFile, []);
    const record = {
      id: payload.id || `profile-${Date.now()}`,
      applicantName: payload.applicantName || 'Unbekannt',
      applicantRole: payload.applicantRole || 'Rolle',
      applicantFocus: payload.applicantFocus || 'Ziel',
      mediaType: payload.mediaType || 'Text',
      mediaLink: payload.mediaLink || '',
      createdAt: new Date().toISOString()
    };
    profiles.push(record);
    saveJson(profilesFile, profiles);
    sendJson(res, { success: true, profile: record });
    return;
  }

  if (pathname === '/server/api/schema') {
    const schema = {
      tables: [
        'users',
        'sessions',
        'business_workspaces',
        'application_profiles',
        'investor_calculations'
      ]
    };
    sendJson(res, { success: true, schema });
    return;
  }

  const filePath = pathname === '/' ? path.join(rootDir, 'index.html') : path.join(rootDir, pathname.replace(/^\//, ''));
  if (filePath.startsWith(rootDir) || filePath === rootDir) {
    serveFile(res, filePath);
    return;
  }

  sendText(res, 'Forbidden', 403);
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server B runtime listening on http://127.0.0.1:${port}`);
});
