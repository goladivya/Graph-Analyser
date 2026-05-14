import { StepTypes } from "../animation/StepTypes";

export function wsModelSteps(cy, n, k, beta) {
  const steps = [];
  const existingEdges = new Set();

  steps.push({ type: StepTypes.CLEAR_GRAPH });

  for (let i = 0; i < n; i++) {
    steps.push({ type: StepTypes.ADD_NODE, node: { id: `N${i}`, label: `N${i}` } });
  }

  const halfK = Math.floor(k / 2);

  // Build ring lattice
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= halfK; j++) {
      const neighbor = (i + j) % n;
      const edgeId = getEdgeId(i, neighbor);
      if (!existingEdges.has(edgeId)) {
        existingEdges.add(edgeId);
        steps.push({
          type: StepTypes.ADD_EDGE,
          edge: { id: edgeId, source: `N${i}`, target: `N${neighbor}` }
        });
      }
    }
  }

  steps.push({ type: "APPLY_LAYOUT", layout: "circle" });
  steps.push({ type: "WAIT", duration: 1500 });

  // Rewiring phase
  let rewiredCount = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= halfK; j++) {
      if (Math.random() < beta) {
        const oldTarget = (i + j) % n;
        const oldEdgeId = getEdgeId(i, oldTarget);

        let newTarget, newEdgeId;
        let attempts = 0;
        do {
          newTarget = Math.floor(Math.random() * n);
          newEdgeId = getEdgeId(i, newTarget);
          attempts++;
        } while (
          (newTarget === i || existingEdges.has(newEdgeId)) && attempts < 100
        );

        if (attempts < 100) {
          existingEdges.delete(oldEdgeId);
          steps.push({ type: StepTypes.COLOR_EDGE, edge: oldEdgeId, color: "red" });
          steps.push({ type: StepTypes.REMOVE_EDGE, edgeId: oldEdgeId });
          existingEdges.add(newEdgeId);
          steps.push({
            type: StepTypes.ADD_EDGE,
            edge: { id: newEdgeId, source: `N${i}`, target: `N${newTarget}` }
          });
          steps.push({ type: StepTypes.COLOR_EDGE, edge: newEdgeId, color: "orange" });
          rewiredCount++;
        }
      }
    }
  }

  // ── Compute network metrics ──────────────────────────────────────────────
  const totalEdges = existingEdges.size;
  const maxEdges = (n * (n - 1)) / 2;
  const density = totalEdges / maxEdges;

  // Rebuild adjacency from existingEdges
  const adj = Array.from({ length: n }, () => new Set());
  for (const eid of existingEdges) {
    // Edge IDs are "Ea-b" format
    const parts = eid.replace("E", "").split("-");
    const u = parseInt(parts[0]), v = parseInt(parts[1]);
    if (!isNaN(u) && !isNaN(v)) { adj[u].add(v); adj[v].add(u); }
  }

  // Degree stats
  const degrees = adj.map(s => s.size);
  const avgDeg = degrees.reduce((s, d) => s + d, 0) / n;
  const maxDeg = Math.max(...degrees);
  const minDeg = Math.min(...degrees);

  // Clustering coefficient (actual)
  let triCount = 0, tripletCount = 0;
  for (let v = 0; v < n; v++) {
    const nbrs = [...adj[v]];
    for (let a = 0; a < nbrs.length; a++) {
      for (let b = a + 1; b < nbrs.length; b++) {
        tripletCount++;
        if (adj[nbrs[a]].has(nbrs[b])) triCount++;
      }
    }
  }
  const clusteringCoeff = tripletCount > 0 ? triCount / tripletCount : 0;

  // Theoretical values
  // For WS: clustering ≈ (3(k-2)) / (4(k-1)) * (1-beta)^3 when beta is small
  const theoCluster = k > 2
    ? (3 * (k - 2)) / (4 * (k - 1)) * Math.pow(1 - beta, 3)
    : 0;

  // Average path length estimate via BFS on a sample of nodes (max 10)
  const sampleSize = Math.min(10, n);
  let totalPathLen = 0, pathCount = 0;
  for (let s = 0; s < sampleSize; s++) {
    const dist = new Array(n).fill(-1);
    dist[s] = 0;
    const queue = [s];
    while (queue.length) {
      const v = queue.shift();
      for (const w of adj[v]) {
        if (dist[w] === -1) { dist[w] = dist[v] + 1; queue.push(w); }
      }
    }
    dist.forEach((d, t) => { if (t !== s && d > 0) { totalPathLen += d; pathCount++; } });
  }
  const avgPathLen = pathCount > 0 ? totalPathLen / pathCount : Infinity;

  // Small-world index: high clustering + low path length relative to random
  const randomClustering = k / n;          // ≈ p for equivalent ER
  const randomPathLen = Math.log(n) / Math.log(k || 1); // ln(n)/ln(k) for random
 // const isSmallWorld = clusteringCoeff > randomClustering * 2 && avgPathLen < randomPathLen * 1.5;

  // Connected components
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  function union(a, b) { parent[find(a)] = find(b); }
  for (const eid of existingEdges) {
    const parts = eid.replace("E", "").split("-");
    const u = parseInt(parts[0]), v = parseInt(parts[1]);
    if (!isNaN(u) && !isNaN(v)) union(u, v);
  }
  const components = new Set(Array.from({ length: n }, (_, i) => find(i))).size;

  return {
    steps,
    result: {
      algorithm: "Watts-Strogatz Small World Model",
      // Parameters
      nodes: n,
      k,
      rewiringProbability: beta,
      // Rewiring outcome
      rewiredEdges: rewiredCount,
      totalEdges,
      density: +density.toFixed(4),
      // Degree
      avgDegree: +avgDeg.toFixed(3),
      maxDegree: maxDeg,
      minDegree: minDeg,
      // Clustering
      clusteringCoefficient: +clusteringCoeff.toFixed(4),
      theoreticalClustering: +theoCluster.toFixed(4),
      randomGraphClustering: +randomClustering.toFixed(4),
      // Path length
      avgPathLength: avgPathLen === Infinity ? "∞" : +avgPathLen.toFixed(3),
      estimatedRandomPathLen: +randomPathLen.toFixed(3),
      // Topology
      connectedComponents: components,
      //isSmallWorld,
    }
  };
}

function getEdgeId(a, b) {
  return a < b ? `E${a}-${b}` : `E${b}-${a}`;
}
