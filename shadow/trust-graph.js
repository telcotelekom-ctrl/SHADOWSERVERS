export function createTrustGraph() {
  const nodes = new Map();
  const edges = [];

  return {
    addNode(nodeId, score = 0.5) {
      nodes.set(nodeId, { id: nodeId, score });
      return this;
    },
    addEdge(from, to, weight = 0.5) {
      edges.push({ from, to, weight });
      return this;
    },
    getNode(nodeId) {
      return nodes.get(nodeId) || null;
    },
    getTrustScore(nodeId) {
      const node = this.getNode(nodeId);
      if (!node) {
        return 0;
      }
      const incoming = edges.filter((edge) => edge.to === nodeId).reduce((sum, edge) => sum + edge.weight, 0);
      return Math.min(1, node.score + incoming * 0.1);
    },
    listEdges() {
      return edges;
    }
  };
}
