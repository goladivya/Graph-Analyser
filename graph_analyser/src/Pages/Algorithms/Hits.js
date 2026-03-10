import { StepTypes } from "../animation/StepTypes";


export function hitsSteps(cy, maxIterations = 20, tolerance = 1e-6) {
  const steps = [];
  const nodes = cy.nodes();
  const edges = cy.edges();

  if (nodes.length === 0) {
    return {
      steps: [],
      result: { algorithm: "HITS", error: "Graph is empty" }
    };
  }

  // Build adjacency
  const inNeighbors = {};
  const outNeighbors = {};

  nodes.forEach(n => {
    inNeighbors[n.id()] = [];
    outNeighbors[n.id()] = [];
  });

  edges.forEach(e => {
    const u = e.source().id();
    const v = e.target().id();
    const directed = !!e.data("directed");

    outNeighbors[u].push(v);
    inNeighbors[v].push(u);

    if (!directed) {
      outNeighbors[v].push(u);
      inNeighbors[u].push(v);
    }
  });

  // Initialize
  let hub = {};
  let auth = {};

  nodes.forEach(n => {
    hub[n.id()] = 1;
    auth[n.id()] = 1;
  });

  const l2norm = obj =>
    Math.sqrt(Object.values(obj).reduce((sum, x) => sum + x * x, 0));

  let iteration = 0;

  while (iteration < maxIterations) {

    const newAuth = {};
    const newHub = {};

    nodes.forEach(n => {
      newAuth[n.id()] = 0;
      newHub[n.id()] = 0;
    });

    // --- AUTHORITY UPDATE ---
    nodes.forEach(n => {
      inNeighbors[n.id()].forEach(u => {
        newAuth[n.id()] += hub[u];
      });
    });

    // --- HUB UPDATE ---
    nodes.forEach(n => {
      outNeighbors[n.id()].forEach(v => {
        newHub[n.id()] += auth[v];
      });
    });

    // Normalize
    const authNorm = l2norm(newAuth);
    const hubNorm = l2norm(newHub);

    nodes.forEach(n => {
      if (authNorm > 0) newAuth[n.id()] /= authNorm;
      if (hubNorm > 0) newHub[n.id()] /= hubNorm;
    });

    // Track convergence
    let diff = 0;
    nodes.forEach(n => {
      diff += Math.abs(newAuth[n.id()] - auth[n.id()]);
      diff += Math.abs(newHub[n.id()] - hub[n.id()]);
    });

    auth = newAuth;
    hub = newHub;

    // 🔥 Add animation steps for this iteration
    nodes.forEach(n => {

      steps.push({
        type: StepTypes.UPDATE_LABEL,
        node: n.id(),
        label: `${n.id()}
H:${hub[n.id()].toFixed(3)}
A:${auth[n.id()].toFixed(3)}`
      });

      steps.push({
        type: StepTypes.COLOR_NODE,
        node: n.id(),
        color: authorityColor(auth[n.id()])
      });
    });

    iteration++;

    if (diff < tolerance) break;
  }

  return {
    steps,
    result: {
      algorithm: "HITS",
      hubs: hub,
      authorities: auth,
      iterations: iteration
    }
  };
}

// Color scale based on authority score
function authorityColor(value) {
  // scale between blue (low) → green (high)
  const t = Math.min(1, value * 2);
  const r = Math.round((1 - t) * 50);
  const g = Math.round(150 + t * 80);
  const b = Math.round((1 - t) * 255);
  return `rgb(${r}, ${g}, ${b})`;
}