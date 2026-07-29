// CEOC — Center · Edge · Circle — echtes Organisationsmodul.
//
// Konzept (real umsetzbar, kein Mystizismus):
// - Ein "Circle" ist eine Organisationseinheit/Kooperation mit einer Kapazitätsgrenze.
// - Der "Center" ist die Person, die den Circle angelegt hat (Koordinator/Verantwortlicher).
// - "Edges" sind Mitglieder, die dem Circle beitreten.
// - Kapazität = maxCapacity vs. aktuelle Anzahl an Edges (einfache, überprüfbare Kennzahl).
//
// Persistenz als JSON-Dateien, gleiches Muster wie exchange.js.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data', 'ceoc');
const circlesFile = path.join(dataDir, 'circles.json');
const membershipsFile = path.join(dataDir, 'memberships.json');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return fallback;
  }
}

function saveJson(filePath, data) {
  ensureDir(dataDir);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createCircle(userId, payload) {
  const name = (payload && payload.name || '').trim();
  const description = (payload && payload.description || '').trim().slice(0, 2000);
  const maxCapacity = Number(payload && payload.maxCapacity);

  if (!name) throw fail('Name des Circles ist erforderlich.');
  if (!Number.isFinite(maxCapacity) || maxCapacity < 1) throw fail('maxCapacity muss eine Zahl >= 1 sein.');

  const circles = loadJson(circlesFile, []);
  const circle = {
    id: `circle-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    name,
    description,
    centerUserId: userId,
    maxCapacity,
    createdAt: new Date().toISOString()
  };
  circles.push(circle);
  saveJson(circlesFile, circles);

  // Der Center ist automatisch der erste Edge (mit Rolle "center").
  const memberships = loadJson(membershipsFile, []);
  memberships.push({
    id: `edge-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    circleId: circle.id,
    userId,
    role: 'center',
    joinedAt: new Date().toISOString()
  });
  saveJson(membershipsFile, memberships);

  return circle;
}

function listCircles() {
  const circles = loadJson(circlesFile, []);
  const memberships = loadJson(membershipsFile, []);
  return circles.map((circle) => {
    const edges = memberships.filter((m) => m.circleId === circle.id);
    return { ...circle, edgeCount: edges.length, capacityUsed: edges.length, capacityFree: Math.max(0, circle.maxCapacity - edges.length) };
  });
}

function getCircle(circleId) {
  const circles = loadJson(circlesFile, []);
  const circle = circles.find((c) => c.id === circleId);
  if (!circle) throw fail('Circle nicht gefunden.', 404);
  const memberships = loadJson(membershipsFile, []);
  const edges = memberships.filter((m) => m.circleId === circleId);
  return { ...circle, edges, edgeCount: edges.length, capacityUsed: edges.length, capacityFree: Math.max(0, circle.maxCapacity - edges.length) };
}

function joinCircle(userId, circleId) {
  const circles = loadJson(circlesFile, []);
  const circle = circles.find((c) => c.id === circleId);
  if (!circle) throw fail('Circle nicht gefunden.', 404);

  const memberships = loadJson(membershipsFile, []);
  const existing = memberships.find((m) => m.circleId === circleId && m.userId === userId);
  if (existing) throw fail('Du bist diesem Circle bereits beigetreten.', 409);

  const edgeCount = memberships.filter((m) => m.circleId === circleId).length;
  if (edgeCount >= circle.maxCapacity) throw fail('Circle hat die maximale Kapazität erreicht.', 409);

  const membership = {
    id: `edge-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    circleId,
    userId,
    role: 'edge',
    joinedAt: new Date().toISOString()
  };
  memberships.push(membership);
  saveJson(membershipsFile, memberships);
  return membership;
}

function leaveCircle(userId, circleId) {
  const memberships = loadJson(membershipsFile, []);
  const membership = memberships.find((m) => m.circleId === circleId && m.userId === userId);
  if (!membership) throw fail('Du bist kein Mitglied dieses Circles.', 404);
  if (membership.role === 'center') throw fail('Der Center kann den eigenen Circle nicht verlassen (nur auflösen).', 400);

  const updated = memberships.filter((m) => !(m.circleId === circleId && m.userId === userId));
  saveJson(membershipsFile, updated);
  return { left: true };
}

function getCapacity(circleId) {
  const circles = loadJson(circlesFile, []);
  const circle = circles.find((c) => c.id === circleId);
  if (!circle) throw fail('Circle nicht gefunden.', 404);
  const memberships = loadJson(membershipsFile, []);
  const edgeCount = memberships.filter((m) => m.circleId === circleId).length;
  return {
    circleId,
    maxCapacity: circle.maxCapacity,
    used: edgeCount,
    free: Math.max(0, circle.maxCapacity - edgeCount),
    utilizationPercent: Math.round((edgeCount / circle.maxCapacity) * 100)
  };
}

function listCirclesForUser(userId) {
  const memberships = loadJson(membershipsFile, []);
  const circleIds = memberships.filter((m) => m.userId === userId).map((m) => m.circleId);
  return listCircles().filter((c) => circleIds.includes(c.id));
}

module.exports = {
  createCircle,
  listCircles,
  getCircle,
  joinCircle,
  leaveCircle,
  getCapacity,
  listCirclesForUser
};
