export function schedule(task) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => task());
    return;
  }

  setTimeout(() => task(), 0);
}
