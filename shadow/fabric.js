export function createShadowFabric(geometry, snapEngine) {
  const routes = [];

  return {
    geometry,
    snapEngine,
    route(from, to) {
      const route = {
        id: `route-${Date.now()}`,
        from,
        to,
        stability: 0.7 + (Math.random() * 0.25),
        path: [from, to],
        createdAt: new Date().toISOString()
      };
      routes.push(route);
      return route;
    },
    synchronize() {
      return {
        routes: routes.length,
        nodes: geometry.nodes.length,
        synchronizedAt: new Date().toISOString()
      };
    },
    replicate() {
      return {
        replicated: geometry.nodes.slice(0, 2).map((node) => node.id),
        replicatedAt: new Date().toISOString()
      };
    },
    getSnapshot() {
      return {
        routes: routes.map((route) => ({ id: route.id, stability: route.stability })),
        nodePositions: snapEngine?.getSnapshot?.().positions || {}
      };
    }
  };
}

export function createRelayFabric(options = {}) {
  const nodes = Array.isArray(options.nodes) ? options.nodes : [];

  return {
    nodes,
    relayCount: nodes.filter((node) => node?.relay).length,
    addNode(node) {
      nodes.push(node);
      this.relayCount = nodes.filter((item) => item?.relay).length;
      return this;
    },
    listNodes() {
      return nodes;
    }
  };
}

export function routePacket(fabric, packet) {
  const relayNodes = fabric.listNodes().filter((node) => node?.relay);
  return relayNodes.length ? relayNodes[0] : null;
}
