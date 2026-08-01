// Sphere geometry: evenly distributed points via the Fibonacci sphere.
// Used by the particle engine (Chapter 02 "Birth of the Sphere").
export function fibonacciSphere(count, radius = 300) {
  const points = [];
  const golden = Math.PI * (3 - Math.sqrt(5)); // golden angle
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;        // -1..1
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    points.push({
      x: Math.cos(theta) * r * radius,
      y: y * radius,
      z: Math.sin(theta) * r * radius,
      i
    });
  }
  return points;
}

// Precompute k nearest neighbours per point (for the laser lattice).
export function nearestNeighbours(points, k = 3) {
  const links = [];
  for (let a = 0; a < points.length; a++) {
    const pa = points[a];
    const dists = [];
    for (let b = 0; b < points.length; b++) {
      if (a === b) continue;
      const pb = points[b];
      const d = (pa.x - pb.x) ** 2 + (pa.y - pb.y) ** 2 + (pa.z - pb.z) ** 2;
      dists.push([d, b]);
    }
    dists.sort((m, n) => m[0] - n[0]);
    for (let j = 0; j < k && j < dists.length; j++) {
      const b = dists[j][1];
      if (a < b) links.push([a, b]);      // dedupe undirected edges
    }
  }
  return links;
}
