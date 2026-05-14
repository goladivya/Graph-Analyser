import { StepTypes } from "../animation/StepTypes";

export function erModelSteps(cy, n = 10, p) {
  const steps = [];

  steps.push({ type: StepTypes.CLEAR_GRAPH });

  for (let i = 0; i < n; i++) {
    steps.push({ type: StepTypes.ADD_NODE, node: { id: `N${i}`, label: `N${i}` } });
  }

  // Build edges and track them for metrics
  const edges = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < p) {
        edges.push([i, j]);
        steps.push({
          type: StepTypes.ADD_EDGE,
          edge: { id: `E${i}-${j}`, source: `N${i}`, target: `N${j}` }
        });
      }
    }
  }

  // ── Compute network metrics ──────────────────────────────────────────────
  const m = edges.length;
  const maxEdges = (n * (n - 1)) / 2;
  const actualDensity = maxEdges > 0 ? m / maxEdges : 0;

  // Degree sequence
  const deg = new Array(n).fill(0);
  edges.forEach(([i, j]) => { deg[i]++; deg[j]++; });
  const avgDeg = deg.reduce((s, d) => s + d, 0) / n;
  const maxDeg = Math.max(...deg);
  const minDeg = Math.min(...deg);
  const isolatedNodes = deg.filter(d => d === 0).length;

  // Expected values from theory
  const expectedEdges = Math.round(maxEdges * p);
  const expectedAvgDeg = (n - 1) * p;

  // Connected components via Union-Find
  const parent = Array.from({ length: n }, (_, i) => i);
  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  function union(a, b) { parent[find(a)] = find(b); }
  edges.forEach(([i, j]) => union(i, j));
  const components = new Set(Array.from({ length: n }, (_, i) => find(i))).size;
  const isConnected = components === 1;

  // Giant component threshold: p_c = 1/(n-1)
  const criticalP = n > 1 ? 1 / (n - 1) : 1;
  const aboveThreshold = p > criticalP;

  // Clustering coefficient (theoretical ≈ p for ER)
  // Actual: count triangles
  const adj = Array.from({ length: n }, () => new Set());
  edges.forEach(([i, j]) => { adj[i].add(j); adj[j].add(i); });
  let triangles = 0, triples = 0;
  for (let v = 0; v < n; v++) {
    const nbrs = [...adj[v]];
    for (let a = 0; a < nbrs.length; a++) {
      for (let b = a + 1; b < nbrs.length; b++) {
        triples++;
        if (adj[nbrs[a]].has(nbrs[b])) triangles++;
      }
    }
  }
  const clusteringCoeff = triples > 0 ? triangles / triples : 0;

  // Degree distribution summary (how many nodes have each degree)
  const degDist = {};
  deg.forEach(d => { degDist[d] = (degDist[d] || 0) + 1; });
  const topDegrees = Object.entries(degDist)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, 5)
    .map(([d, cnt]) => ({ degree: Number(d), count: cnt }));

  return {
    steps,
    result: {
      algorithm: "Erdos-Renyi Random Graph",
      // Parameters
      nodes: n,
      probability: p,
      // Edge stats
      actualEdges: m,
      expectedEdges,
      maxPossibleEdges: maxEdges,
      // Density
      actualDensity: +actualDensity.toFixed(4),
      expectedDensity: +p.toFixed(4),
      // Degree stats
      avgDegree: +avgDeg.toFixed(3),
      expectedAvgDegree: +expectedAvgDeg.toFixed(3),
      maxDegree: maxDeg,
      minDegree: minDeg,
      isolatedNodes,
      // Topology
      connectedComponents: components,
      isConnected,
      clusteringCoefficient: +clusteringCoeff.toFixed(4),
      theoreticalClustering: +p.toFixed(4),
      // Phase transition
      criticalProbability: +criticalP.toFixed(4),
      aboveConnectivityThreshold: aboveThreshold,
      // Degree distribution (top degrees)
     // topDegrees,
    }
  };
}
