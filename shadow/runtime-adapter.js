import { createSnapAdapter } from './snap.js';
import { createShadowProtocolOmega } from './protocol.js';

export function createRuntimeAdapter(options = {}) {
  const adapter = createSnapAdapter(options);
  const protocol = createShadowProtocolOmega({ runtime: adapter, identityId: options.identityId });

  return {
    adapter,
    protocol,
    bootstrap() {
      return {
        adapter: adapter.adapter,
        capabilities: adapter.capabilities,
        protocol: protocol.getSnapshot(),
        session: protocol.createSession('shadow-runtime'),
        event: protocol.createEvent('runtime-bootstrap', { adapter: adapter.adapter })
      };
    }
  };
}
