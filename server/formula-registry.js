// Problem→Formel-Registry ("TTT light") — echtes Nachweis-Log für Ideen.
//
// Konzept (real, kein Notariat, keine Rechtsberatung):
// - Ein Nutzer trägt ein Problem ein.
// - Dazu werden eine oder mehrere "Formel"-Versionen (Lösungsbeschreibung/Spezifikation)
//   hinzugefügt.
// - Jede Version bekommt einen Zeitstempel und einen SHA-256-Fingerabdruck ihres Texts.
//   Das ist eine überprüfbare, aber rein technische Nachweisspur ("wer hat wann welchen
//   exakten Text gespeichert") — KEIN rechtsgültiges Patent- oder Notariatsersatz.
//
// Persistenz als JSON-Dateien, gleiches Muster wie exchange.js / ceoc.js.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, 'data', 'formula-registry');
const problemsFile = path.join(dataDir, 'problems.json');

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

function fingerprint(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function createProblem(userId, payload) {
  const title = (payload && payload.title || '').trim();
  const description = (payload && payload.description || '').trim().slice(0, 4000);
  const tags = Array.isArray(payload && payload.tags)
    ? payload.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 20)
    : [];
  const initialFormula = (payload && payload.formulaText || '').trim();

  if (!title) throw fail('Titel des Problems ist erforderlich.');
  if (!description) throw fail('Beschreibung des Problems ist erforderlich.');

  const now = new Date().toISOString();
  const problem = {
    id: `problem-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    userId,
    title,
    description,
    tags,
    createdAt: now,
    formulas: []
  };

  if (initialFormula) {
    problem.formulas.push({
      version: 1,
      text: initialFormula.slice(0, 8000),
      fingerprint: fingerprint(initialFormula),
      createdAt: now
    });
  }

  const problems = loadJson(problemsFile, []);
  problems.push(problem);
  saveJson(problemsFile, problems);
  return problem;
}

function listProblems() {
  const problems = loadJson(problemsFile, []);
  return problems.map((p) => ({
    id: p.id,
    userId: p.userId,
    title: p.title,
    description: p.description,
    tags: p.tags,
    createdAt: p.createdAt,
    versionCount: p.formulas.length,
    latestVersion: p.formulas.length ? p.formulas[p.formulas.length - 1] : null
  }));
}

function getProblem(problemId) {
  const problems = loadJson(problemsFile, []);
  const problem = problems.find((p) => p.id === problemId);
  if (!problem) throw fail('Problem nicht gefunden.', 404);
  return problem;
}

function addFormulaVersion(userId, problemId, payload) {
  const text = (payload && payload.text || '').trim();
  if (!text) throw fail('Formeltext ist erforderlich.');

  const problems = loadJson(problemsFile, []);
  const problem = problems.find((p) => p.id === problemId);
  if (!problem) throw fail('Problem nicht gefunden.', 404);
  if (problem.userId !== userId) throw fail('Nur der Ersteller kann neue Versionen hinzufügen.', 403);

  const version = {
    version: problem.formulas.length + 1,
    text: text.slice(0, 8000),
    fingerprint: fingerprint(text),
    createdAt: new Date().toISOString()
  };
  problem.formulas.push(version);
  saveJson(problemsFile, problems);
  return problem;
}

function listProblemsForUser(userId) {
  return loadJson(problemsFile, []).filter((p) => p.userId === userId);
}

module.exports = {
  createProblem,
  listProblems,
  getProblem,
  addFormulaVersion,
  listProblemsForUser,
  fingerprint
};
