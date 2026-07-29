export function createShadowGeometry(config = {}) {
  const core = config.core || { id: 'core', label: 'Shadow Core', weight: 1 };
  const shells = Array.isArray(config.shells) && config.shells.length
    ? config.shells.map((shell, index) => ({ ...shell, layer: index + 1 }))
    : [
        { id: 'shell-1', label: 'Identity', weight: 1 },
        { id: 'shell-2', label: 'Mesh', weight: 1.2 },
        { id: 'shell-3', label: 'Knowledge', weight: 1.4 }
      ];

  const nodes = Array.isArray(config.nodes)
    ? config.nodes.map((node, index) => ({ ...node, id: node.id || `node-${index + 1}`, layer: node.layer || 1 }))
    : [
        { id: 'node-identity', label: 'Identity', layer: 1, role: 'identity' },
        { id: 'node-sync', label: 'Sync', layer: 2, role: 'sync' },
        { id: 'node-knowledge', label: 'Knowledge', layer: 3, role: 'knowledge' }
      ];

  function buildTangents() {
    return nodes.map((node, index) => ({
      id: `${node.id}-tangent-${index + 1}`,
      source: node.id,
      target: nodes[(index + 1) % nodes.length]?.id || node.id,
      strength: 0.6 + (index % 3) * 0.15,
      kind: 'tangent'
    }));
  }

  const tangents = buildTangents();

  return {
    core,
    shells,
    nodes,
    tangents,
    overlays: config.overlays || [{ id: 'overlay-portal', label: 'Portal Layer' }],
    createNode(node) {
      const created = { ...node, id: node.id || `node-${Date.now()}` };
      nodes.push(created);
      tangents.push(...buildTangents().slice(-1));
      return created;
    },
    getSnapshot() {
      return {
        core,
        shellCount: shells.length,
        nodeCount: nodes.length,
        tangentCount: tangents.length,
        layers: shells.map((shell) => shell.label),
        overlays: this.overlays.map((overlay) => overlay.label)
      };
    }
  };
}
