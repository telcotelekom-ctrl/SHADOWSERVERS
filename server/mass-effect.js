// MassEffect-Konzeptmodul ("Meff = Z(t)·U·T·L·R·E·51240963").
//
// WICHTIG — Einordnung (nicht verhandelbar):
// Diese Formel ist KEINE reale Physik. Sie multipliziert nicht kompatible, frei erfundene
// "Faktoren" (Zeit, Universum, Licht, Raum, Energie) mit einer willkürlichen Konstante
// (51240963) ohne Einheiten, Herleitung oder empirischen Bezug. Es handelt sich um ein
// FIKTIVES Konzept-/Story-Werkzeug (vergleichbar mit einem Spielmechanik- oder
// Weltenbau-Rechner), das NICHT zur Berechnung realer Masse, Energie oder
// Reaktorkapazität verwendet werden darf. Jede Antwort dieses Moduls trägt deshalb ein
// explizites `disclaimer`-Feld.
//
// Persistenz als JSON-Dateien, gleiches Muster wie exchange.js / ceoc.js / formula-registry.js.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DISCLAIMER = 'Fiktiver Konzept-Parameter – keine reale physikalische Größe, keine Energie- oder Materieerzeugung. Nur für Story-/Planungszwecke.';

const dataDir = path.join(__dirname, 'data', 'mass-effect');
const contextsFile = path.join(dataDir, 'contexts.json');
const egrStepsFile = path.join(dataDir, 'egr-steps.json');
const MAGIC_CONSTANT = 51240963;

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

function toNumber(value, fieldName) {
  const num = Number(value);
  if (value === undefined || value === null || value === '' || Number.isNaN(num)) {
    throw fail(`Feld "${fieldName}" muss eine Zahl sein.`);
  }
  return num;
}

// Bildet einen beliebigen reellen Wert weich auf (0, 1) ab — reine Anzeige-Normalisierung,
// keine physikalische Bedeutung (tanh-basiert, damit auch riesige Produkte darstellbar bleiben).
function normalize(value) {
  return (Math.tanh(value / MAGIC_CONSTANT) + 1) / 2;
}

function calculate(userId, payload) {
  const zValue = toNumber(payload && payload.zValue, 'zValue');
  const universe = toNumber(payload && payload.universe, 'universe');
  const timeFactor = toNumber(payload && payload.timeFactor, 'timeFactor');
  const lightFactor = toNumber(payload && payload.lightFactor, 'lightFactor');
  const spaceFactor = toNumber(payload && payload.spaceFactor, 'spaceFactor');
  const energy = toNumber(payload && payload.energy, 'energy');
  const sourceModule = (payload && payload.sourceModule || 'Unbekannt').toString().trim().slice(0, 60);

  const massEffective = zValue * universe * timeFactor * lightFactor * spaceFactor * energy * MAGIC_CONSTANT;
  const normalized = normalize(massEffective);

  const record = {
    id: `mec-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId,
    zValue,
    universe,
    timeFactor,
    lightFactor,
    spaceFactor,
    energy,
    massEffective,
    normalized,
    sourceModule,
    createdAt: new Date().toISOString(),
    disclaimer: DISCLAIMER
  };

  const contexts = loadJson(contextsFile, []);
  contexts.push(record);
  saveJson(contextsFile, contexts);

  return record;
}

function getContext(contextId) {
  const contexts = loadJson(contextsFile, []);
  const record = contexts.find((c) => c.id === contextId);
  if (!record) throw fail('Kontext nicht gefunden.', 404);
  return record;
}

function listContextsForUser(userId) {
  return loadJson(contextsFile, []).filter((c) => c.userId === userId);
}

function calculateEgrStep(userId, payload) {
  const stepName = (payload && payload.stepName || '').toString().trim().slice(0, 80);
  const zValue = toNumber(payload && payload.zValue, 'zValue');
  const energyStep = toNumber(payload && payload.energyStep, 'energyStep');
  const fieldLight = toNumber(payload && payload.fieldLight, 'fieldLight');
  const chamberSpace = toNumber(payload && payload.chamberSpace, 'chamberSpace');
  const timeStep = toNumber(payload && payload.timeStep, 'timeStep');
  const universeContext = payload && payload.universeContext !== undefined
    ? toNumber(payload.universeContext, 'universeContext')
    : 1;

  if (!stepName) throw fail('Feld "stepName" ist erforderlich.');

  const massEffectiveStep = zValue * universeContext * timeStep * fieldLight * chamberSpace * energyStep * MAGIC_CONSTANT;
  const normalized = normalize(massEffectiveStep);

  const record = {
    id: `egr-step-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId,
    stepName,
    zValue,
    universeContext,
    timeStep,
    fieldLight,
    chamberSpace,
    energyStep,
    massEffectiveStep,
    normalized,
    timestamp: new Date().toISOString(),
    disclaimer: DISCLAIMER
  };

  const steps = loadJson(egrStepsFile, []);
  steps.push(record);
  saveJson(egrStepsFile, steps);

  return record;
}

function listEgrStepsForUser(userId) {
  return loadJson(egrStepsFile, []).filter((s) => s.userId === userId);
}

module.exports = {
  DISCLAIMER,
  calculate,
  getContext,
  listContextsForUser,
  calculateEgrStep,
  listEgrStepsForUser
};
