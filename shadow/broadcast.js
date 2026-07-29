export function createBroadcastMesh() {
  const listeners = [];

  return {
    subscribe(listener) {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
          listeners.splice(index, 1);
        }
      };
    },
    publish(payload) {
      listeners.forEach((listener) => listener(payload));
      return payload;
    }
  };
}
