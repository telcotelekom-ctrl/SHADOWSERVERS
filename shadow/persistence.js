// Matrix persistence (Ultra-Stufe II) — durable, browser-native storage for the
// Wabenmatrix via IndexedDB (falls back to localStorage). This makes everything the
// system builds — including runtime-synthesized programs — survive a reload.
// No server, no Node: pure IndexedDB + a debounced auto-save on every matrix change.

const DB_NAME = 'shadow-usup';
const STORE = 'matrix';
const DB_VERSION = 1;

function hasIndexedDB() {
  return typeof indexedDB !== 'undefined' && indexedDB !== null;
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).get(key);
    r.onsuccess = () => { db.close(); resolve(r.result ?? null); };
    r.onerror = () => { db.close(); reject(r.error); };
  });
}

async function idbDelete(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

// Storage abstraction: IndexedDB when available, else localStorage.
async function put(key, value) {
  if (hasIndexedDB()) return idbPut(key, value);
  localStorage.setItem(`${DB_NAME}:${key}`, JSON.stringify(value));
  return true;
}
async function get(key) {
  if (hasIndexedDB()) return idbGet(key);
  const raw = localStorage.getItem(`${DB_NAME}:${key}`);
  return raw ? JSON.parse(raw) : null;
}
async function del(key) {
  if (hasIndexedDB()) return idbDelete(key);
  localStorage.removeItem(`${DB_NAME}:${key}`);
  return true;
}

// createMatrixPersistence(matrix) — restore on start, auto-save on change (debounced).
export function createMatrixPersistence(matrix, key = 'usup-matrix') {
  let timer = null;
  let lastSavedAt = null;
  let unsubscribe = null;

  async function save() {
    await put(key, { savedAt: new Date().toISOString(), state: matrix.serialize() });
    lastSavedAt = new Date().toISOString();
    return lastSavedAt;
  }

  function scheduleSave(delay = 400) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { save().catch(() => {}); }, delay);
  }

  // restore() → load stored state into the matrix; returns count or null.
  async function restore() {
    const record = await get(key);
    if (!record || !record.state) return null;
    const res = matrix.hydrate(record.state);
    return res.ok ? { count: res.count, savedAt: record.savedAt } : null;
  }

  // enableAutoSave() → persist after every matrix mutation.
  function enableAutoSave() {
    if (unsubscribe) return;
    unsubscribe = matrix.subscribe(() => scheduleSave());
  }
  function disableAutoSave() { if (unsubscribe) { unsubscribe(); unsubscribe = null; } }

  async function clear() { disableAutoSave(); await del(key); }

  return {
    save,
    restore,
    enableAutoSave,
    disableAutoSave,
    clear,
    backend: hasIndexedDB() ? 'indexeddb' : 'localstorage',
    lastSavedAt() { return lastSavedAt; }
  };
}
