const IDENTITY_STORE_KEY = 'shadow_identity';

async function indexedDBSave(key, value) {
  if (typeof indexedDB === 'undefined') {
    globalThis.__shadowIdentityStore = globalThis.__shadowIdentityStore || {};
    globalThis.__shadowIdentityStore[key] = value;
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
    return globalThis.__shadowIdentityStore?.[key] ?? null;
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

export async function createIdentity() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );

  const pub = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const priv = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

  await indexedDBSave(IDENTITY_STORE_KEY, { pub, priv });
  return { pub, priv };
}

export async function sign(data) {
  const stored = await indexedDBLoad(IDENTITY_STORE_KEY);
  if (!stored?.priv) {
    throw new Error('No shadow identity found');
  }

  const key = await crypto.subtle.importKey(
    'jwk',
    stored.priv,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  return crypto.subtle.sign({ name: 'ECDSA' }, key, new TextEncoder().encode(data));
}
