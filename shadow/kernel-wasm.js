import { createRuntimeAdapter } from './runtime-adapter.js';

export function startShadowKernelWasm(options = {}) {
  const runtime = createRuntimeAdapter(options);
  const bootstrap = runtime.bootstrap();

  if (typeof window !== 'undefined') {
    window.__shadowKernelWasm = bootstrap;
  }

  return bootstrap;
}
