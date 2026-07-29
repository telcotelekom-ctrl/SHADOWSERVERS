async function indexedDBSave(key, value) {
  if (typeof indexedDB === 'undefined') {
    globalThis.__shadowStorageStore = globalThis.__shadowStorageStore || {};
    globalThis.__shadowStorageStore[key] = value;
    return;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('shadow-os', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('kernel', { keyPath: 'key' });
    };
    request.onsuccess = () => {
      const tx = request.result.transaction('kernel', 'readwrite');
      const store = tx.objectStore('kernel');
      const putRequest = store.put({ key, value });
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

async function indexedDBLoad(key) {
  if (typeof indexedDB === 'undefined') {
    return globalThis.__shadowStorageStore?.[key] ?? null;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('shadow-os', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('kernel', { keyPath: 'key' });
    };
    request.onsuccess = () => {
      const tx = request.result.transaction('kernel', 'readonly');
      const store = tx.objectStore('kernel');
      const getRequest = store.get(key);
      getRequest.onsuccess = () => resolve(getRequest.result?.value ?? null);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function save(key, value) {
  await indexedDBSave(key, value);
}

export async function load(key) {
  return indexedDBLoad(key);
}
