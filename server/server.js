require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const WebSocket = require('ws');
const nodemailer = require('nodemailer');
const hotspotAuth = require('./protected');
const hotspotQr = require('./qrcode');
const spotify = require('./spotify');
const hotspotConfigStore = require('./config-store');
const exchange = require('./exchange');
const { findAvailablePort } = require('./port-utils');
const ceoc = require('./ceoc');
const formulaRegistry = require('./formula-registry');
const massEffect = require('./mass-effect');

const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const sessionsFile = path.join(dataDir, 'sessions.json');
const workspacesFile = path.join(dataDir, 'workspaces.json');
const profilesFile = path.join(dataDir, 'profiles.json');
const investorFile = path.join(dataDir, 'investor.json');
const officeParticipationsFile = path.join(dataDir, 'office-participations.json');
const contactMessagesFile = path.join(dataDir, 'contact-messages.json');
const educationInterestsFile = path.join(dataDir, 'education-interests.json');

const EDUCATION_FIELDS = [
  'Informationstechnologie', 'Künstliche Intelligenz', 'Softwareentwicklung', 'Webentwicklung',
  'Netzwerktechnik', 'Cybersicherheit', 'Elektrotechnik', 'Maschinenbau', 'Robotik', 'Mechatronik',
  'Bauwesen', 'Architektur', 'Gesundheitsberufe', 'Pflege', 'Logistik', 'Handel', 'Marketing',
  'Mediengestaltung', 'Grafikdesign', 'Musik', 'Film', 'Fotografie', 'Journalismus', 'Recht',
  'Verwaltung', 'Unternehmertum', 'Nachhaltigkeit', 'Landwirtschaft', 'Gastronomie', 'Tourismus',
  'Sprachen', 'Kommunikation', 'Handwerk', 'Kreativwirtschaft', 'Forschung und Entwicklung'
];

const EDUCATION_LEVELS = [
  { id: 'offen', label: 'Offene Lernplattform', note: 'Wissen, Kurse, Videos, Projekte, KI-Lernen — eigene Zertifikate' },
  { id: 'weiterbildung', label: 'Berufliche Weiterbildung', note: 'Fachkurse für Unternehmen und Privatpersonen — Branchenzertifikate' },
  { id: 'mbo', label: 'Anerkannte Berufsausbildung (MBO)', note: 'Erfordert staatliche Anerkennung und Zulassungen' },
  { id: 'hbo-wo', label: 'Hochschulniveau (HBO/WO)', note: 'Erfordert gesetzliche Akkreditierung' }
];

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

// Legacy (seed admin account): unsalted sha256 hex digest.
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// New accounts: salted scrypt, stored as "scrypt$<saltHex>$<hashHex>".
function hashPasswordSecure(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string') return false;
  if (storedHash.startsWith('scrypt$')) {
    const [, saltHex, hashHex] = storedHash.split('$');
    if (!saltHex || !hashHex) return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const derived = crypto.scryptSync(password, salt, expected.length);
    return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
  }
  // Legacy plain sha256 hex digest (seed admin account only).
  const legacy = hashPassword(password);
  const expected = Buffer.from(storedHash);
  const provided = Buffer.from(legacy);
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
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

  const officeParticipations = loadJson(officeParticipationsFile, []);
  if (!officeParticipations.length) {
    saveJson(officeParticipationsFile, []);
  }

  const contactMessages = loadJson(contactMessagesFile, []);
  if (!contactMessages.length) {
    saveJson(contactMessagesFile, []);
  }
}

function buildSmtpTransport(config) {
  if (!config || !config.smtpHost || !config.smtpUser || !config.smtpPass) {
    return null;
  }
  const port = Number(config.smtpPort) || 587;
  return nodemailer.createTransport({
    host: config.smtpHost,
    port,
    secure: port === 465,
    auth: { user: config.smtpUser, pass: config.smtpPass }
  });
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

function sendExchangeError(res, error) {
  const statusCode = error.statusCode || 500;
  sendJson(res, { success: false, error: error.message || 'Onbekende fout' }, statusCode);
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

  if (pathname === '/server/api/health' || pathname === '/api/health') {
    sendJson(res, { ok: true, runtime: 'shadow-os', timestamp: new Date().toISOString() });
    return;
  }

  if (pathname === '/server/api/shadow/status' || pathname === '/api/status' || pathname === '/api/status') {
    sendJson(res, {
      ok: true,
      runtime: 'shadow-os',
      status: 'online',
      port: process.env.PORT || 3000,
      timestamp: new Date().toISOString(),
      message: 'ShadowOS runtime is active and reachable.'
    });
    return;
  }

  if (pathname === '/api/manifest/list' && req.method === 'GET') {
    const manifestItems = [
      { id: 'portal', title: 'Portal', status: 'active' },
      { id: 'shadow-runtime', title: 'Shadow Runtime', status: 'active' },
      { id: 'workspace', title: 'Workspace', status: 'active' }
    ];
    sendJson(res, { success: true, items: manifestItems });
    return;
  }

  if (pathname === '/api/manifest/sync' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req);
      sendJson(res, { success: true, item: payload, syncedAt: new Date().toISOString() });
    } catch (error) {
      sendJson(res, { success: false, error: 'Ungültige Anfrage' }, 400);
    }
    return;
  }

  if (pathname === '/api/messages' && req.method === 'GET') {
    const messages = loadJson(contactMessagesFile, []).map((item) => ({
      id: item.id,
      name: item.name || 'Shadow',
      message: item.message || '',
      createdAt: item.createdAt || new Date().toISOString()
    }));
    sendJson(res, { success: true, items: messages });
    return;
  }

  if ((pathname === '/server/api/companion-updates' || pathname === '/api/companion-updates') && req.method === 'GET') {
    const profiles = loadJson(profilesFile, []);
    const workspaces = loadJson(workspacesFile, []);
    const contacts = loadJson(contactMessagesFile, []);
    const portfolioFindings = [
      'Shadow Companion online und bereit.',
      `Portfolio-Analyse: ${profiles.length} Profil(e) im Runtime-Workspace erkannt.`,
      `Arbeitsräume: ${workspaces.length} Workspace(s) verfügbar, inklusive ${workspaces[0]?.data?.company || 'Shadow'} .`,
      `Kontakt-Queue: ${contacts.length} Nachricht(en) wartet auf Bearbeitung.`
    ];
    sendJson(res, { success: true, items: portfolioFindings, insights: { profiles, workspaces, contactsCount: contacts.length } });
    return;
  }

  if ((pathname === '/server/api/portfolio/findings' || pathname === '/api/portfolio/findings') && req.method === 'GET') {
    const profiles = loadJson(profilesFile, []);
    const workspaces = loadJson(workspacesFile, []);
    const contacts = loadJson(contactMessagesFile, []);
    const findings = [
      {
        id: 'profile-1',
        title: 'Profil im Shadow-Workspace erkannt',
        detail: profiles[0]?.applicantName || 'Profil verfügbar',
        kind: 'profile'
      },
      {
        id: 'workspace-1',
        title: 'Arbeitsbereich verbunden',
        detail: workspaces[0]?.data?.company || 'Workspace verfügbar',
        kind: 'workspace'
      },
      {
        id: 'contacts-1',
        title: 'Kontakt-Queue vorhanden',
        detail: `${contacts.length} neue Nachricht(en) warten`,
        kind: 'contacts'
      }
    ];
    sendJson(res, { success: true, items: findings });
    return;
  }

  if (pathname === '/api/submit' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req);
      const result = {
        success: true,
        message: 'Submission received by Shadow runtime',
        payload
      };
      sendJson(res, result);
    } catch (error) {
      sendJson(res, { success: false, error: 'Ungültige Anfrage' }, 400);
    }
    return;
  }

  if ((pathname === '/api/contacts' || pathname === '/server/api/contacts') && req.method === 'GET') {
    const contacts = loadJson(contactMessagesFile, []);
    sendJson(res, { success: true, items: contacts });
    return;
  }

  if (pathname === '/api/chats' && req.method === 'GET') {
    const chats = loadJson(contactMessagesFile, []).map((item) => ({
      id: item.id,
      title: item.name || 'Chat',
      message: item.message || '',
      createdAt: item.createdAt || new Date().toISOString()
    }));
    sendJson(res, { success: true, items: chats });
    return;
  }

  if (pathname === '/server/auth/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const users = loadJson(usersFile, []);
      const user = users.find((item) => item.email === body.email && verifyPassword(body.password || '', item.passwordHash));
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

  if (pathname === '/server/auth/register' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const name = (body.name || '').trim();
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      if (!name || !email || password.length < 8) {
        sendJson(res, { success: false, error: 'Name, E-Mail und ein Passwort mit mindestens 8 Zeichen sind erforderlich.' }, 400);
        return;
      }

      const users = loadJson(usersFile, []);
      if (users.some((item) => item.email === email)) {
        sendJson(res, { success: false, error: 'Diese E-Mail ist bereits registriert.' }, 409);
        return;
      }

      const user = {
        id: `user-${crypto.randomBytes(8).toString('hex')}`,
        name,
        email,
        role: 'user',
        passwordHash: hashPasswordSecure(password),
        createdAt: new Date().toISOString()
      };
      users.push(user);
      saveJson(usersFile, users);

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
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }, 201);
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

  if ((pathname === '/server/api/investor/local' || pathname === '/api/investor/calculate/local') && req.method === 'POST') {
    const payload = await readJsonBody(req);
    sendJson(res, { success: true, result: buildInvestorResult('local', payload) });
    return;
  }

  if ((pathname === '/server/api/investor/global' || pathname === '/api/investor/calculate/global') && req.method === 'POST') {
    const payload = await readJsonBody(req);
    sendJson(res, { success: true, result: buildInvestorResult('global', payload) });
    return;
  }

  if ((pathname === '/server/api/investor/production' || pathname === '/api/investor/calculate/production') && req.method === 'POST') {
    const payload = await readJsonBody(req);
    sendJson(res, { success: true, result: buildInvestorResult('production', payload) });
    return;
  }

  if ((pathname === '/server/api/investor/time-index' || pathname === '/api/investor/calculate/time-index') && req.method === 'POST') {
    const payload = await readJsonBody(req);
    sendJson(res, { success: true, result: buildInvestorResult('time-index', payload) });
    return;
  }

  if ((pathname === '/server/api/investor/complete' || pathname === '/api/investor/calculate/complete') && req.method === 'POST') {
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

  if ((pathname === '/server/api/workspaces' || pathname === '/api/workspaces') && req.method === 'GET') {
    const workspaces = loadJson(workspacesFile, []);
    sendJson(res, { success: true, items: workspaces });
    return;
  }

  if ((pathname === '/server/api/workspaces' || pathname === '/api/workspaces') && req.method === 'POST') {
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

  if ((pathname === '/server/api/profiles' || pathname === '/api/profiles') && req.method === 'GET') {
    const profiles = loadJson(profilesFile, []);
    sendJson(res, { success: true, items: profiles });
    return;
  }

  if ((pathname === '/server/api/profiles' || pathname === '/api/profiles') && req.method === 'POST') {
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
        'investor_calculations',
        'office_participations'
      ]
    };
    sendJson(res, { success: true, schema });
    return;
  }

  if (pathname === '/server/api/office/participation' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req);
      const entries = loadJson(officeParticipationsFile, []);
      const record = {
        id: `office-${Date.now()}`,
        name: payload.name || 'Unbekannter Nutzer',
        focus: payload.focus || 'Allgemein',
        vision: payload.vision || '',
        support: payload.support || '',
        createdAt: new Date().toISOString(),
        status: 'submitted'
      };
      entries.push(record);
      saveJson(officeParticipationsFile, entries);
      sendJson(res, { success: true, participation: record, message: 'Ergebnis wurde gespeichert.' });
    } catch (error) {
      sendJson(res, { success: false, error: 'Ungültige Anfrage' }, 400);
    }
    return;
  }

  if (pathname === '/server/api/office/participation' && req.method === 'GET') {
    const entries = loadJson(officeParticipationsFile, []);
    sendJson(res, { success: true, items: entries });
    return;
  }

  if (pathname === '/server/api/education/fields' && req.method === 'GET') {
    sendJson(res, { success: true, fields: EDUCATION_FIELDS, levels: EDUCATION_LEVELS });
    return;
  }

  if (pathname === '/server/api/education/interest' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req);
      const name = (payload.name || '').trim();
      const email = (payload.email || '').trim();
      const level = EDUCATION_LEVELS.some((item) => item.id === payload.level) ? payload.level : 'offen';
      const fields = Array.isArray(payload.fields) ? payload.fields.filter((f) => EDUCATION_FIELDS.includes(f)) : [];
      if (!name || fields.length === 0) {
        sendJson(res, { success: false, error: 'Name und mindestens eine Fachrichtung sind erforderlich.' }, 400);
        return;
      }
      const record = {
        id: `edu-${Date.now()}`,
        name,
        email,
        level,
        fields,
        message: (payload.message || '').slice(0, 1000),
        createdAt: new Date().toISOString(),
        status: 'submitted'
      };
      const entries = loadJson(educationInterestsFile, []);
      entries.push(record);
      saveJson(educationInterestsFile, entries);
      sendJson(res, { success: true, interest: record, message: 'Interesse wurde gespeichert.' }, 201);
    } catch (error) {
      sendJson(res, { success: false, error: 'Ungültige Anfrage' }, 400);
    }
    return;
  }

  if (pathname === '/server/api/education/interest' && req.method === 'GET') {
    const entries = loadJson(educationInterestsFile, []);
    sendJson(res, { success: true, items: entries });
    return;
  }

  if (pathname === '/server/api/master-document') {
    sendJson(res, {
      success: true,
      document: {
        title: 'Universal Company Builder',
        version: '1.0.0',
        status: 'operational',
        generatedAt: new Date().toISOString(),
        modules: ['runtime', 'portal', 'auth', 'workspaces', 'investor', 'documentation'],
        sections: [
          {
            id: 'system',
            group: 'system',
            title: 'Systemübersicht',
            summary: 'Ein vollständiges digitales Betriebssystem für Unternehmen, Teams, Zukunft und Nutzung.',
            bullets: ['Portal, Business Suite und Bewerbung sind direkt erreichbar.', 'Server B fungiert als reale Runtime-Schicht.', 'Die Dokumentation ist Teil des Systems selbst.'],
            keywords: ['system', 'portal', 'runtime', 'unternehmenssystem']
          },
          {
            id: 'api',
            group: 'technik',
            title: 'API & Backend',
            summary: 'Echte Node.js-Routen für Health, Auth, Workspaces, Profile und Investor-Rechner.',
            bullets: ['Health-Endpoint verfügbar.', 'Authentifizierung und Sessions sind funktional.', 'Json-API liefert echte Datenstrukturen.'],
            keywords: ['api', 'backend', 'node', 'auth']
          },
          {
            id: 'architecture',
            group: 'architektur',
            title: 'Architektur & Server',
            summary: 'Server A und Server B sind als digitale Präsenz und lokale Runtime konzipiert.',
            bullets: ['Server A ist die sichtbare Präsenz.', 'Server B ist die operative Runtime und Shadow-Ansicht.', 'Portal, App und Daten bleiben synchronisierbar.'],
            keywords: ['architektur', 'server', 'servera', 'serverb']
          },
          {
            id: 'philosophy',
            group: 'philosophie',
            title: 'Teilnahme & Branding',
            summary: 'Die Plattform verbindet Technik, Verantwortung, Teilnahme und eine dauerhafte Identität.',
            bullets: ['Freiwilligkeit und Freiheit sind grundlegend.', 'Vertrauen, Wachstum und Verantwortung prägen das System.', 'Die Marke ist sichtbar, dauerhaft und kooperativ.'],
            keywords: ['philosophie', 'branding', 'teilnahme', 'werte']
          }
        ],
        downloads: {
          markdown: '/MASTER_DOKUMENT.md',
          html: '/master-dokument.html'
        }
      }
    });
    return;
  }

  if (pathname === '/server/api/contact' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req);
      const name = (payload.name || '').trim();
      const email = (payload.email || '').trim();
      const message = (payload.message || '').trim();
      const room = (payload.room || '').trim();
      if (!name || !email || !message) {
        sendJson(res, { success: false, error: 'Name, E-Mail und Nachricht sind erforderlich.' }, 400);
        return;
      }

      const record = {
        id: `contact-${Date.now()}`,
        room: room || null,
        name,
        email,
        message,
        createdAt: new Date().toISOString(),
        delivered: false
      };

      const roomConfig = room ? hotspotConfigStore.getConfig(room) : null;
      const transport = buildSmtpTransport(roomConfig);
      if (transport) {
        try {
          await transport.sendMail({
            from: roomConfig.smtpFrom || roomConfig.smtpUser,
            to: roomConfig.smtpTo || roomConfig.smtpUser,
            replyTo: email,
            subject: `PSY-TEL Studio Kontakt von ${name}`,
            text: message
          });
          record.delivered = true;
        } catch (mailError) {
          record.deliveryError = mailError.message;
          record.delivered = false;
        }
      } else {
        record.deliveryStatus = 'smtp-unavailable';
      }

      const messages = loadJson(contactMessagesFile, []);
      messages.push(record);
      saveJson(contactMessagesFile, messages);

      sendJson(res, {
        success: true,
        delivered: record.delivered,
        stored: true,
        status: record.delivered ? 'delivered' : 'stored-locally',
        message: record.delivered
          ? 'Nachricht wurde versendet und lokal gespeichert.'
          : 'SMTP nicht konfiguriert oder Versand fehlgeschlagen – Nachricht wurde lokal gespeichert.'
      });
    } catch (error) {
      sendJson(res, { success: false, error: 'Ungültige Anfrage' }, 400);
    }
    return;
  }

  // Audience join: passcode is per-room (per operator account). A room with
  // no access code configured yet is open (no passcode required).
  if (pathname === '/server/api/hotspot/login' && req.method === 'POST') {
    try {
      const payload = await readJsonBody(req);
      const room = (payload.room || '').trim();
      if (!room) {
        sendJson(res, { success: false, error: 'Room ist erforderlich.' }, 400);
        return;
      }
      const result = hotspotAuth.loginAudience(room, payload.passcode);
      if (!result.success) {
        sendJson(res, { success: false, error: 'Ungültiger Zugangscode' }, 401);
        return;
      }
      sendJson(res, result);
    } catch (error) {
      sendJson(res, { success: false, error: 'Ungültige Anfrage' }, 400);
    }
    return;
  }

  if (pathname === '/server/api/hotspot/qr' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401);
      return;
    }
    try {
      const target = `http://${req.headers.host}/psy-tel-audience.html?room=${encodeURIComponent(auth.user.id)}`;
      const dataUrl = await hotspotQr.generateQrDataUrl(target);
      sendJson(res, { success: true, url: target, dataUrl });
    } catch (error) {
      sendJson(res, { success: false, error: error.message }, 500);
    }
    return;
  }

  if (pathname === '/server/api/hotspot/state' && req.method === 'GET') {
    const room = requestUrl.searchParams.get('room') || '';
    const token = hotspotAuth.extractToken(req, requestUrl);
    if (!room || (!hotspotAuth.isRoomOpen(room) && !hotspotAuth.isValidAudienceToken(token, room))) {
      sendJson(res, { success: false, error: 'Zugangscode erforderlich', state: null }, 401);
      return;
    }
    sendJson(res, { success: true, state: latestTransposerStateByRoom.get(room) || null });
    return;
  }

  if (pathname === '/server/api/hotspot/config-status' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401);
      return;
    }
    sendJson(res, { success: true, ...hotspotConfigStore.getStatus(auth.user.id) });
    return;
  }

  if (pathname === '/server/api/hotspot/setup' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401);
      return;
    }
    try {
      const payload = await readJsonBody(req);
      const { applied } = hotspotConfigStore.saveConfig(auth.user.id, payload);
      sendJson(res, {
        success: true,
        applied,
        ...hotspotConfigStore.getStatus(auth.user.id)
      });
    } catch (error) {
      sendJson(res, { success: false, error: 'Ungültige Anfrage' }, 400);
    }
    return;
  }

  if (pathname === '/server/api/spotify/key' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) {
      sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401);
      return;
    }
    try {
      const config = hotspotConfigStore.getConfig(auth.user.id);
      const keyName = requestUrl.searchParams.get('key') || 'C';
      const query = requestUrl.searchParams.get('query') || '';
      const limit = Number(requestUrl.searchParams.get('limit')) || 10;
      const result = await spotify.matchTracksByKey({
        keyName,
        query,
        limit,
        credentials: { clientId: config.spotifyClientId, clientSecret: config.spotifyClientSecret }
      });
      sendJson(res, { success: true, ...result });
    } catch (error) {
      sendJson(res, { success: false, error: error.message }, 500);
    }
    return;
  }

  // --- Universal Exchange Network (UEN) — ruilbeurs zonder geld ------------

  if (pathname === '/server/api/exchange/categories' && req.method === 'GET') {
    sendJson(res, { success: true, categories: exchange.CATEGORIES, deliveryMethods: exchange.DELIVERY_METHODS });
    return;
  }

  if (pathname === '/server/api/exchange/offers' && req.method === 'GET') {
    const category = requestUrl.searchParams.get('category') || undefined;
    const status = requestUrl.searchParams.get('status') || undefined;
    sendJson(res, { success: true, items: exchange.listOffers({ category, status }) });
    return;
  }

  if (pathname === '/server/api/exchange/offers' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      const offer = exchange.createOffer(auth.user.id, payload);
      sendJson(res, { success: true, offer }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  if (pathname === '/server/api/exchange/requests' && req.method === 'GET') {
    const category = requestUrl.searchParams.get('category') || undefined;
    const status = requestUrl.searchParams.get('status') || undefined;
    sendJson(res, { success: true, items: exchange.listRequests({ category, status }) });
    return;
  }

  if (pathname === '/server/api/exchange/requests' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      const request = exchange.createRequest(auth.user.id, payload);
      sendJson(res, { success: true, request }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  if (pathname === '/server/api/exchange/matches' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    sendJson(res, { success: true, items: exchange.findMatchesForUser(auth.user.id) });
    return;
  }

  if (pathname === '/server/api/exchange/contracts' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    sendJson(res, { success: true, items: exchange.listContractsForUser(auth.user.id) });
    return;
  }

  if (pathname === '/server/api/exchange/contracts' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      const contract = exchange.createContract(auth.user.id, payload);
      sendJson(res, { success: true, contract }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  const contractActionMatch = pathname.match(/^\/server\/api\/exchange\/contracts\/([^/]+)\/(accept|delivery|complete|cancel|contact)$/);
  if (contractActionMatch) {
    const [, contractId, action] = contractActionMatch;
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }

    try {
      if (action === 'accept' && req.method === 'POST') {
        sendJson(res, { success: true, contract: exchange.acceptContract(auth.user.id, contractId) });
        return;
      }
      if (action === 'delivery' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        sendJson(res, { success: true, contract: exchange.scheduleDelivery(auth.user.id, contractId, payload) });
        return;
      }
      if (action === 'complete' && req.method === 'POST') {
        sendJson(res, { success: true, contract: exchange.confirmCompletion(auth.user.id, contractId) });
        return;
      }
      if (action === 'cancel' && req.method === 'POST') {
        sendJson(res, { success: true, contract: exchange.cancelContract(auth.user.id, contractId) });
        return;
      }
      if (action === 'contact' && req.method === 'GET') {
        const resolveUser = (userId) => loadJson(usersFile, []).find((u) => u.id === userId);
        sendJson(res, { success: true, ...exchange.getCounterpartContact(auth.user.id, contractId, resolveUser) });
        return;
      }
      sendText(res, 'Not Found', 404);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  if (pathname === '/server/api/exchange/profile' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    sendJson(res, { success: true, profile: exchange.getExchangeProfile(auth.user.id) });
    return;
  }

  if (pathname === '/server/api/exchange/profile' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      sendJson(res, { success: true, profile: exchange.saveExchangeProfile(auth.user.id, payload) });
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  if (pathname === '/server/api/exchange/ratings' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      sendJson(res, { success: true, rating: exchange.submitRating(auth.user.id, payload) }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  const reputationMatch = pathname.match(/^\/server\/api\/exchange\/reputation\/([^/]+)$/);
  if (reputationMatch && req.method === 'GET') {
    sendJson(res, { success: true, ...exchange.getReputation(decodeURIComponent(reputationMatch[1])) });
    return;
  }

  // ---- CEOC: Center · Edge · Circle Organisationsmodul ----
  if (pathname === '/server/api/ceoc/circles' && req.method === 'GET') {
    sendJson(res, { success: true, items: ceoc.listCircles() });
    return;
  }

  if (pathname === '/server/api/ceoc/circles' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      sendJson(res, { success: true, circle: ceoc.createCircle(auth.user.id, payload) }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  if (pathname === '/server/api/ceoc/circles/mine' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    sendJson(res, { success: true, items: ceoc.listCirclesForUser(auth.user.id) });
    return;
  }

  const ceocCircleMatch = pathname.match(/^\/server\/api\/ceoc\/circles\/([^/]+)$/);
  if (ceocCircleMatch && req.method === 'GET') {
    try {
      sendJson(res, { success: true, circle: ceoc.getCircle(decodeURIComponent(ceocCircleMatch[1])) });
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  const ceocJoinMatch = pathname.match(/^\/server\/api\/ceoc\/circles\/([^/]+)\/join$/);
  if (ceocJoinMatch && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      sendJson(res, { success: true, membership: ceoc.joinCircle(auth.user.id, decodeURIComponent(ceocJoinMatch[1])) }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  const ceocLeaveMatch = pathname.match(/^\/server\/api\/ceoc\/circles\/([^/]+)\/leave$/);
  if (ceocLeaveMatch && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      sendJson(res, { success: true, ...ceoc.leaveCircle(auth.user.id, decodeURIComponent(ceocLeaveMatch[1])) });
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  const ceocCapacityMatch = pathname.match(/^\/server\/api\/ceoc\/circles\/([^/]+)\/capacity$/);
  if (ceocCapacityMatch && req.method === 'GET') {
    try {
      sendJson(res, { success: true, capacity: ceoc.getCapacity(decodeURIComponent(ceocCapacityMatch[1])) });
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  // ---- Problem→Formel-Registry (TTT light) ----
  if (pathname === '/server/api/formula-registry/problems' && req.method === 'GET') {
    sendJson(res, { success: true, items: formulaRegistry.listProblems() });
    return;
  }

  if (pathname === '/server/api/formula-registry/problems' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      sendJson(res, { success: true, problem: formulaRegistry.createProblem(auth.user.id, payload) }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  if (pathname === '/server/api/formula-registry/problems/mine' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    sendJson(res, { success: true, items: formulaRegistry.listProblemsForUser(auth.user.id) });
    return;
  }

  const formulaVersionMatch = pathname.match(/^\/server\/api\/formula-registry\/problems\/([^/]+)\/versions$/);
  if (formulaVersionMatch && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      sendJson(res, { success: true, problem: formulaRegistry.addFormulaVersion(auth.user.id, decodeURIComponent(formulaVersionMatch[1]), payload) }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  const formulaProblemMatch = pathname.match(/^\/server\/api\/formula-registry\/problems\/([^/]+)$/);
  if (formulaProblemMatch && req.method === 'GET') {
    try {
      sendJson(res, { success: true, problem: formulaRegistry.getProblem(decodeURIComponent(formulaProblemMatch[1])) });
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  // ---- MassEffect-Konzeptmodul (fiktiver Meff=Z(t)*U*T*L*R*E*51240963 Parameter) ----
  if (pathname === '/server/api/mass-effect/calculate' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      sendJson(res, { success: true, context: massEffect.calculate(auth.user.id, payload) }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  if (pathname === '/server/api/mass-effect/context/mine' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    sendJson(res, { success: true, items: massEffect.listContextsForUser(auth.user.id) });
    return;
  }

  const massEffectContextMatch = pathname.match(/^\/server\/api\/mass-effect\/context\/([^/]+)$/);
  if (massEffectContextMatch && req.method === 'GET') {
    try {
      sendJson(res, { success: true, context: massEffect.getContext(decodeURIComponent(massEffectContextMatch[1])) });
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  if (pathname === '/server/api/mass-effect/egr-step' && req.method === 'POST') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    try {
      const payload = await readJsonBody(req);
      sendJson(res, { success: true, step: massEffect.calculateEgrStep(auth.user.id, payload) }, 201);
    } catch (error) {
      sendExchangeError(res, error);
    }
    return;
  }

  if (pathname === '/server/api/mass-effect/egr-step/mine' && req.method === 'GET') {
    const auth = getAuthenticatedUser(req);
    if (!auth) { sendJson(res, { success: false, error: 'Bitte zuerst im Portal anmelden.' }, 401); return; }
    sendJson(res, { success: true, items: massEffect.listEgrStepsForUser(auth.user.id) });
    return;
  }

  const filePath = pathname === '/' ? path.join(rootDir, 'index.html') : path.join(rootDir, pathname.replace(/^\//, ''));
  if (filePath.startsWith(rootDir) || filePath === rootDir) {
    serveFile(res, filePath);
    return;
  }

  sendText(res, 'Forbidden', 403);
});

// PSY-TEL Hotspot Studio broadcast layer: each room (portal user id) is an
// isolated broadcast channel. The operator's transposer pushes state via a
// "broadcaster" connection (authenticated with their portal Bearer token);
// the hotspot relays it only to "audience" connections in the same room
// (authenticated with a passcode-issued audience token, or open if the
// room has no access code configured).
const latestTransposerStateByRoom = new Map();
const wss = new WebSocket.Server({ noServer: true });
const companionWss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1:3000'}`);
  if (requestUrl.pathname === '/psy-tel') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
    return;
  }

  if (requestUrl.pathname === '/ws/companion') {
    companionWss.handleUpgrade(req, socket, head, (ws) => {
      companionWss.emit('connection', ws, req);
    });
    return;
  }

  socket.destroy();
});

function isValidBroadcasterToken(token, room) {
  if (!token || !room) return false;
  const sessions = loadJson(sessionsFile, []);
  const session = sessions.find((item) => item.token === token);
  return Boolean(session && session.userId === room);
}

companionWss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'companion-status',
    message: 'Shadow Companion online. Alle Live-Aktionen laufen über den Shadow-Server.'
  }));

  ws.on('message', (payload) => {
    const text = payload.toString();
    if (!text) return;
    ws.send(JSON.stringify({
      type: 'companion-message',
      message: `Shadow erhalten: ${text}`
    }));
  });
});

wss.on('connection', (ws, req) => {
  const connUrl = new URL(req.url, 'http://internal');
  const room = connUrl.searchParams.get('room') || '';
  const role = connUrl.searchParams.get('role') === 'broadcaster' ? 'broadcaster' : 'audience';
  const token = connUrl.searchParams.get('token') || '';

  if (!room) {
    ws.close(4400, 'room required');
    return;
  }

  if (role === 'broadcaster') {
    if (!isValidBroadcasterToken(token, room)) {
      ws.close(4401, 'unauthorized');
      return;
    }
  } else if (!hotspotAuth.isRoomOpen(room) && !hotspotAuth.isValidAudienceToken(token, room)) {
    ws.close(4401, 'unauthorized');
    return;
  }

  ws.room = room;
  ws.role = role;

  ws.send(JSON.stringify({
    type: 'studio-status',
    message: 'Verbunden mit PSY-TEL Axis Hotspot.'
  }));

  const currentState = latestTransposerStateByRoom.get(room);
  if (currentState) {
    ws.send(JSON.stringify({ type: 'transposer-broadcast', ...currentState }));
  }

  ws.on('message', (msg) => {
    if (ws.role !== 'broadcaster') return;
    let data;
    try {
      data = JSON.parse(msg);
    } catch (error) {
      return;
    }

    if (data.type === 'transposer-update') {
      const state = {
        chords: data.chords,
        tempo: data.tempo,
        keyOrig: data.keyOrig,
        keyTarget: data.keyTarget
      };
      latestTransposerStateByRoom.set(room, state);

      wss.clients.forEach((client) => {
        if (client !== ws && client.room === room && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'transposer-broadcast', ...state }));
        }
      });
    }
  });
});

async function startServer() {
  const requestedPort = Number(process.env.PORT || 3000);
  const port = await findAvailablePort(requestedPort, '127.0.0.1', 20);

  server.listen(port, '127.0.0.1', () => {
    console.log(`Server B runtime listening on http://127.0.0.1:${port}`);
    console.log(`PSY-TEL Hotspot WebSocket listening on ws://127.0.0.1:${port}/psy-tel`);
  });
}

startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});


