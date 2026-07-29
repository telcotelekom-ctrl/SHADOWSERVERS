function detectCapabilities() {
  const capabilities = [];
  if (typeof window !== 'undefined') capabilities.push('browser');
  if (typeof window !== 'undefined' && 'indexedDB' in window) capabilities.push('indexeddb');
  if (typeof window !== 'undefined' && 'crypto' in window) capabilities.push('webcrypto');
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) capabilities.push('service-worker');
  if (typeof window !== 'undefined' && 'WebSocket' in window) capabilities.push('websocket');
  if (typeof window !== 'undefined' && 'WebRTC' in window) capabilities.push('webrtc');
  if (typeof window !== 'undefined' && 'SharedWorker' in window) capabilities.push('shared-worker');
  if (typeof window !== 'undefined' && 'Bluetooth' in window) capabilities.push('bluetooth');
  if (typeof window !== 'undefined' && 'NDEFReader' in window) capabilities.push('nfc');
  if (typeof window !== 'undefined' && 'localStorage' in window) capabilities.push('storage');
  if (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) capabilities.push('mobile');
  if (typeof navigator !== 'undefined' && /Linux|Win|Mac/i.test(navigator.userAgent)) capabilities.push('desktop');
  return capabilities;
}

export function createSnapAdapter(runtime = {}) {
  const capabilities = runtime.capabilities || detectCapabilities();
  const adapterName = runtime.adapter || 'browser';

  return {
    adapter: adapterName,
    capabilities,
    detect() {
      return {
        adapter: adapterName,
        capabilities,
        available: capabilities.length > 0,
        runtime: typeof window !== 'undefined' ? 'browser' : 'unknown'
      };
    },
    activate(feature) {
      if (!capabilities.includes(feature)) {
        capabilities.push(feature);
      }
      return capabilities;
    }
  };
}
