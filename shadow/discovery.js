export function discover() {
  return [
    ...localPeers(),
    ...savedPeers(),
    ...publicBootstrap()
  ];
}

function localPeers() {
  return [];
}

function savedPeers() {
  try {
    const saved = JSON.parse(localStorage.getItem('shadow-peers') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function publicBootstrap() {
  return [];
}
