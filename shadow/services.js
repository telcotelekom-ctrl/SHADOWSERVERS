export function createShadowServerServices(context = {}) {
  const services = {
    storage: { active: true, kind: 'local-store' },
    transport: { active: true, kind: 'browser-transport' },
    sync: { active: true, kind: 'fabric-sync' },
    ai: { active: true, kind: 'insight-engine' },
    knowledge: { active: true, kind: 'semantic-graph' },
    shadowLayer: { active: true, kind: 'portal-sphere' },
    visos: { active: true, kind: 'adaptive-spheres' },
    veryl: { active: true, kind: 'yield-layers' }
  };

  return {
    services,
    activate(serviceName) {
      if (services[serviceName]) {
        services[serviceName].active = true;
      }
      return services[serviceName] || null;
    },
    getSnapshot() {
      return Object.fromEntries(Object.entries(services).map(([name, value]) => [name, { ...value }]));
    }
  };
}
