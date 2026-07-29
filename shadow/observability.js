export function createObserver() {
  const events = [];

  return {
    record(event) {
      events.push({ ...event, at: new Date().toISOString() });
      return events[events.length - 1];
    },
    list() {
      return events;
    }
  };
}
