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
