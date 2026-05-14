
export function dijkstraSteps(cy, sourceId, targetId) {
  const steps = [];

  // ── Normalise IDs (trim whitespace, keep original casing) ────────────────
  sourceId = String(sourceId).trim();
  targetId = String(targetId).trim();

  // ── Validate that both nodes exist ───────────────────────────────────────
  const sourceEl = cy.getElementById(sourceId);
  const targetEl = cy.getElementById(targetId);

  if (!sourceEl.length) {
    return {
      steps,
      result: {
        algorithm: "Dijkstra",
        error: `Source node "${sourceId}" not found in graph.`,
        path: [],
        cost: null,
      },
    };
  }
  if (!targetEl.length) {
    return {
      steps,
      result: {
        algorithm: "Dijkstra",
        error: `Target node "${targetId}" not found in graph.`,
        path: [],
        cost: null,
      },
    };
  }
  if (sourceId === targetId) {
    steps.push({ type: "FINAL_PATH_NODE", node: sourceId });
    return {
      steps,
      result: {
        algorithm: "Dijkstra",
        source: sourceId,
        target: targetId,
        path: [sourceId],
        cost: 0,
        hops: 0,
        distances: { [sourceId]: 0 },
      },
    };
  }

  // ── Initialise distances ──────────────────────────────────────────────────
  const dist = {};
  const prev = {};
  cy.nodes().forEach(n => {
    dist[n.id()] = Infinity;
    prev[n.id()] = null;
  });
  dist[sourceId] = 0;

  const unvisited = new Set(cy.nodes().map(n => n.id()));

  // ── Main loop ─────────────────────────────────────────────────────────────
  while (unvisited.size > 0) {

    // Pick unvisited node with smallest distance (linear scan — fine for UI)
    let current = null;
    let bestDist = Infinity;
    for (const id of unvisited) {
      if (dist[id] < bestDist) {
        bestDist = dist[id];
        current = id;
      }
    }

    // All remaining nodes are unreachable
    if (current === null || dist[current] === Infinity) break;

    unvisited.delete(current);

    // Highlight visited node
    steps.push({ type: "VISIT_NODE", node: current });

    // Reached target — stop early
    if (current === targetId) break;

    // ── Relax neighbours ────────────────────────────────────────────────────
    // connectedEdges() works for both directed and undirected graphs
    cy.getElementById(current).connectedEdges().forEach(e => {
      const srcId = e.source().id();
      const tgtId = e.target().id();

      // Determine the neighbour on the other end
      // For directed edges only follow forward direction
      const isDirected = e.data("directed") === true || e.data("directed") === "true";
      let neighbour = null;

      if (isDirected) {
        // Only relax in the direction of the edge
        if (srcId === current) neighbour = tgtId;
        else return; // don't traverse backwards on directed edge
      } else {
        neighbour = srcId === current ? tgtId : srcId;
      }

      if (!unvisited.has(neighbour)) return;

      const w = parseFloat(e.data("weight")) || 1;
      const newDist = dist[current] + w;

      if (newDist < dist[neighbour]) {
        dist[neighbour] = newDist;
        prev[neighbour] = current;

        steps.push({ type: "RELAX_EDGE",     edge: e.id() });
        steps.push({ type: "UPDATE_DISTANCE", node: neighbour, distance: newDist });
      }
    });
  }

  // ── Reconstruct path ──────────────────────────────────────────────────────
  let path = [];

  if (dist[targetId] !== Infinity) {
    let curr = targetId;
    while (curr !== null) {
      path.push(curr);
      curr = prev[curr];
    }
    path.reverse();

    // Animate the final path
    for (let i = 0; i < path.length; i++) {
      steps.push({ type: "FINAL_PATH_NODE", node: path[i] });

      if (i < path.length - 1) {
        // Find the connecting edge between path[i] and path[i+1]
        const edge = cy.edges().filter(e => {
          const s = e.source().id(), t = e.target().id();
          return (s === path[i] && t === path[i + 1]) ||
                 (s === path[i + 1] && t === path[i]);
        })[0];

        if (edge) steps.push({ type: "FINAL_PATH_EDGE", edge: edge.id() });
      }
    }
  }

  // ── Build distance map (exclude unreachable) ─────────────────────────────
  const distMap = {};
  Object.entries(dist).forEach(([id, d]) => {
    distMap[id] = d === Infinity ? "∞" : +d.toFixed(4);
  });

  return {
    steps,
    result: {
      algorithm:  "Dijkstra",
      source:     sourceId,
      target:     targetId,
      path,
      cost:       dist[targetId] === Infinity ? null : +dist[targetId].toFixed(4),
      hops:       path.length > 1 ? path.length - 1 : 0,
      distances:  distMap,
      reachable:  dist[targetId] !== Infinity,
    },
  };
}
