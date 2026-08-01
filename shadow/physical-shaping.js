// Physical Shaping Engine — turns the living matrix into a 3D shape model that
// can be exported to CAD / 3D-print / CNC. Cells carry no geometry, so radius is
// DERIVED from energy and position from a deterministic cluster+layer layout.
import { energyOf } from './wabe-animation.js';

// Deterministic 3D position: clusters on a ring, cells fanned within the cluster,
// layer lifts along Z. Stable across runs so exports are reproducible.
function positionFor(cell, index, clusterIndex, clusterCount, withinCluster) {
  if (cell.position) return cell.position;
  const clusterAngle = clusterCount ? (clusterIndex / clusterCount) * Math.PI * 2 : 0;
  const ringR = 120;
  const cx = Math.cos(clusterAngle) * ringR;
  const cy = Math.sin(clusterAngle) * ringR;
  const local = withinCluster ? (index / withinCluster) * Math.PI * 2 : 0;
  const localR = 30 + (index % 5) * 8;
  return {
    x: +(cx + Math.cos(local) * localR).toFixed(2),
    y: +(cy + Math.sin(local) * localR).toFixed(2),
    z: +((cell.layer || 1) * 20).toFixed(2)
  };
}

// exportPhysicalShape(matrix) → array of shape descriptors, one per cell.
export function exportPhysicalShape(matrix) {
  const cells = typeof matrix.list === 'function' ? matrix.list() : (matrix.cells || []);
  const clusters = [...new Set(cells.map((c) => c.cluster))];
  const counts = clusters.reduce((acc, cl) => { acc[cl] = cells.filter((c) => c.cluster === cl).length; return acc; }, {});
  const seen = {};
  return cells.map((cell) => {
    const clusterIndex = clusters.indexOf(cell.cluster);
    const i = (seen[cell.cluster] = (seen[cell.cluster] || 0));
    seen[cell.cluster] += 1;
    const energy = typeof cell.energy === 'number' ? cell.energy : energyOf(cell);
    return {
      id: cell.id,
      cluster: cell.cluster,
      type: cell.type,
      shape: cell.type === 'process' ? 'torus' : cell.type === 'code' ? 'cube' : 'sphere',
      radius: +Math.sqrt((energy * 4) + 1).toFixed(3),
      position: positionFor(cell, i, clusterIndex, clusters.length, counts[cell.cluster])
    };
  });
}
