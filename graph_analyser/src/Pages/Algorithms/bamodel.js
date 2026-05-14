import { StepTypes } from "../animation/StepTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Barabási–Albert Preferential Attachment Model
// ─────────────────────────────────────────────────────────────────────────────
//
// Faithful to the original 1999 Barabási & Albert paper:
//
//   1. Initialise with m0 ≥ m nodes connected as a star (or small clique).
//   2. At each step add one new node; connect it to exactly m existing nodes.
//   3. Preferential attachment: sample m neighbours proportional to degree.
//      Canonical method — sample a random edge, pick one endpoint at random.
//      This gives P(i) = k_i / (2|E|) exactly, with no bias correction needed.
//   4. Repeat until n total nodes exist.
//
// Theoretical properties (large-n limit):
//   P(k) ~ k^{-γ},  γ = 3
//   <k>  = 2m
//   Max hub degree ~ sqrt(n) * m
//
// References:
//   Barabási & Albert, Science 286 (1999) 509-512
//   Albert & Barabási, Rev. Mod. Phys. 74 (2002) 47-97
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Linear-time power-law exponent estimate using Hill estimator (MLE).
 * Estimates γ for P(k) ~ k^{-γ} from degree sequence with k ≥ kMin.
 */
function hillEstimator(degrees, kMin = 1) {
  const tail = degrees.filter(k => k >= kMin);
  if (tail.length < 2) return null;
  const logSum = tail.reduce((s, k) => s + Math.log(k / kMin), 0);
  return 1 + tail.length / logSum;
}

/**
 * Kolmogorov–Smirnov–style R² check: how well does a power-law fit the
 * empirical cumulative degree distribution?
 * Returns a score in [0,1] (1 = perfect fit).
 */
function powerLawR2(degrees, gamma) {
  if (gamma == null || !isFinite(gamma)) return null;
  const sorted = [...degrees].sort((a, b) => a - b);
  const n = sorted.length;
  const kMin = sorted[0];

  let ssRes = 0, ssTot = 0;
  const meanCCDF = 0.5;

  sorted.forEach((k, i) => {
    const empirical = 1 - i / n;                          // CCDF P(K ≥ k)
    const theoretical = Math.pow(k / kMin, -(gamma - 1)); // Pareto CCDF
    ssRes += (empirical - theoretical) ** 2;
    ssTot += (empirical - meanCCDF) ** 2;
  });

  return ssTot > 0 ? Math.max(0, +(1 - ssRes / ssTot).toFixed(3)) : null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * baModelSteps(cy, n, m, m0)
 *
 * @param {Object} cy  – Cytoscape instance (used for ADD_NODE / ADD_EDGE steps)
 * @param {number} n   – Total nodes to build (default 20)
 * @param {number} m   – Edges added per new node (default 2)
 * @param {number} m0  – Seed nodes (default max(m+1, 3)); must be ≥ m
 */
export function baModelSteps(cy, n = 20, m = 2, m0 = null) {
  const steps = [];

  // ── Parameter validation ────────────────────────────────────────────────
  m  = Math.max(1, Math.floor(m));
  m0 = m0 != null ? Math.max(m, Math.floor(m0)) : Math.max(m + 1, 3);

  if (n <= m0) {
    alert(`n (${n}) must be greater than m0 (${m0}).`);
    return { steps: [], result: {} };
  }

  // ── Internal graph state (mirrors what the animation builds) ────────────
  // degree[i] = current degree of node i
  const degree = new Array(n).fill(0);

  // edgeList[e] = [u, v] for the e-th edge  (the "urn" for edge-sampling)
  const edgeList = [];

  // edgeSet for duplicate prevention
  const edgeSet = new Set();

  // ── Helper: add an undirected edge to internal state + emit ADD_EDGE step
  function addEdge(u, v) {
    const key = u < v ? `${u}-${v}` : `${v}-${u}`;
    if (edgeSet.has(key)) return false;          // ignore duplicates
    edgeSet.add(key);
    edgeList.push([u, v]);
    degree[u]++;
    degree[v]++;
    steps.push({
      type: StepTypes.ADD_EDGE,
      edge: { id: `E${key}`, source: `N${u}`, target: `N${v}` }
    });
    return true;
  }

  // ── Helper: preferential-attachment sample
  // Picks one node with P(i) ∝ degree(i) using edge-endpoint sampling.
  // If edgeList is empty (seed phase), falls back to uniform sampling.
  function samplePA(excludeSet, currentN) {
    if (edgeList.length === 0) {
      // Uniform fallback during seed construction
      let candidate;
      let tries = 0;
      do {
        candidate = Math.floor(Math.random() * currentN);
        tries++;
      } while (excludeSet.has(candidate) && tries < 200);
      return candidate;
    }
    // Sample a random edge, pick one endpoint at random
    // → P(picking node i) = degree(i) / (2|E|)  ✓
    let tries = 0;
    while (tries < 500) {
      const edge = edgeList[Math.floor(Math.random() * edgeList.length)];
      const endpoint = edge[Math.random() < 0.5 ? 0 : 1];
      if (!excludeSet.has(endpoint)) return endpoint;
      tries++;
    }
    // Rare fallback: all edges point to excluded nodes; pick any non-excluded
    for (let i = 0; i < currentN; i++) {
      if (!excludeSet.has(i)) return i;
    }
    return null;
  }

  // ─── PHASE 1: Build seed network (m0 nodes) ─────────────────────────────
  // Use a star topology: node 0 at centre, nodes 1…m0-1 as leaves.
  // This ensures every seed node has degree ≥ 1 (required for PA to work).

  steps.push({ type: StepTypes.CLEAR_GRAPH });

  for (let i = 0; i < m0; i++) {
    steps.push({ type: StepTypes.ADD_NODE, node: { id: `N${i}`, label: `N${i}` } });
  }

  // Connect as a path (1-2-3-...-m0) to give non-trivial starting degrees
  for (let i = 0; i < m0 - 1; i++) {
    addEdge(i, i + 1);
  }
  // Close the ring if m0 ≥ 3 (avoids isolated endpoints for PA)
  if (m0 >= 3) addEdge(0, m0 - 1);

  // Pause so the user sees the seed network before growth begins
  steps.push({ type: StepTypes.WAIT, duration: 800 });

  // ─── PHASE 2: Preferential attachment growth ─────────────────────────────
  for (let i = m0; i < n; i++) {
    // Add the new node
    steps.push({ type: StepTypes.ADD_NODE, node: { id: `N${i}`, label: `N${i}` } });

    // Colour new node distinctly while it's being connected
    steps.push({ type: 'COLOR_NODE', node: `N${i}`, color: '#f59e0b' });

    // Sample m unique targets via preferential attachment
    const targets = new Set();
    let attempts = 0;
    while (targets.size < Math.min(m, i) && attempts < 1000) {
      const t = samplePA(targets, i);
      if (t != null) targets.add(t);
      attempts++;
    }

    // Connect new node to each sampled target
    targets.forEach(t => {
      addEdge(i, t);
      // Briefly highlight the hub being connected to
      steps.push({ type: 'COLOR_NODE', node: `N${t}`, color: '#6366f1' });
    });

    // Reset highlight after connections are made
    steps.push({ type: StepTypes.WAIT, duration: 30 });
    steps.push({ type: 'COLOR_NODE', node: `N${i}`, color: '#94a3b8' });
    targets.forEach(t => {
      steps.push({ type: 'COLOR_NODE', node: `N${t}`, color: '#94a3b8' });
    });
  }

  // Final layout
  steps.push({ type: StepTypes.APPLY_LAYOUT, layout: 'cose' });

  // ─── Post-growth: colour by degree (hub visualisation) ─────────────────
  const maxDegree = Math.max(...degree.slice(0, n));
  for (let i = 0; i < n; i++) {
    const norm = maxDegree > 0 ? degree[i] / maxDegree : 0;
    // Degree heatmap: grey (low) → violet (high) → gold (top hub)
    const r = Math.round(148 - norm * 30);
    const g = Math.round(163 - norm * 130);
    const b = Math.round(184 + norm * 71);
    const color = norm > 0.85 ? '#f59e0b'
                : norm > 0.6  ? '#8b5cf6'
                : `rgb(${r},${g},${b})`;
    steps.push({ type: 'COLOR_NODE', node: `N${i}`, color });
  }

  // ─── Compute result metrics ──────────────────────────────────────────────
  const totalEdges = edgeList.length;
  const maxPossibleEdges = (n * (n - 1)) / 2;
  const density = totalEdges / maxPossibleEdges;

  // True degree array (only first n entries)
  const degrees = degree.slice(0, n);
  const avgDeg = degrees.reduce((s, d) => s + d, 0) / n;
  const maxDeg = Math.max(...degrees);
  const minDeg = Math.min(...degrees);

  // Theoretical expected values (large-n limit)
  // <k> = 2m  (each new node adds m edges → 2m degree units)
  const theoreticalAvgDeg = 2 * m;
  // Theoretical total edges = m*(n - m0) + edges_in_seed
  const seedEdges = m0 >= 3 ? m0 : m0 - 1;   // ring vs path
  const theoreticalEdges = m * (n - m0) + seedEdges;

  // Degree distribution
  const degFreq = {};
  degrees.forEach(k => { degFreq[k] = (degFreq[k] || 0) + 1; });
  const degDist = Object.entries(degFreq)
    .map(([k, cnt]) => ({
      degree: Number(k),
      count: cnt,
      fraction: +(cnt / n).toFixed(3),
    }))
    .sort((a, b) => b.degree - a.degree);

  // Hubs: degree > 2× average (standard threshold)
  const hubThreshold = Math.ceil(2 * avgDeg);
  const hubNodes = degrees
    .map((k, i) => ({ node: `N${i}`, degree: k }))
    .filter(d => d.degree >= hubThreshold)
    .sort((a, b) => b.degree - a.degree);

  // Power-law exponent (Hill MLE estimator, kMin = m)
  const gamma = hillEstimator(degrees, m);
  const r2    = powerLawR2(degrees, gamma);

  // Scale-free quality: theoretical γ = 3 ± 0.5 is good
  const gammaOk = gamma != null && gamma >= 2.0 && gamma <= 4.5;

  return {
    steps,
    result: {
      algorithm: "Barabasi-Albert (True Preferential Attachment)",

      // ── Parameters ──
      totalNodes:     n,
      seedNodes:      m0,
      edgesPerNode:   m,

      // ── Edge counts ──
      totalEdges,
      theoreticalEdges,

      // ── Density ──
      density:        +density.toFixed(4),

      // ── Degree statistics ──
      avgDegree:      +avgDeg.toFixed(3),
      theoreticalAvgDeg,                       // should ≈ 2m
      maxDegree:      maxDeg,
      minDegree:      minDeg,

      // ── Hubs ──
      hubThreshold,
      hubCount:       hubNodes.length,
      hubFraction:    +(hubNodes.length / n).toFixed(3),
      topHubs:        hubNodes.slice(0, 6),

      // ── Power-law fit ──
      gammaEstimate:  gamma != null ? +gamma.toFixed(3) : null,
      gammaTheory:    3,
      powerLawR2:     r2,
      scaleFreeQuality: gammaOk ? "Good" : (gamma != null ? "Moderate (small-n effect)" : "N/A"),

      // ── Degree distribution ──
      degreeDistribution: degDist,

      // ── Scale-free indicators ──
      degreeHeterogeneity: +(maxDeg / (avgDeg || 1)).toFixed(2),
    },
  };
}
