export function dijkstraSteps(cy, sourceId, targetId) {
  const steps = [];
  const dist = {};
  const prev = {};

  cy.nodes().forEach(n => {
    dist[n.id()] = Infinity;
    prev[n.id()] = null;
  });

  dist[sourceId] = 0;

  const unvisited = new Set(cy.nodes().map(n => n.id()));

  while (unvisited.size) {

    // pick node with minimum distance
    let current = [...unvisited].reduce((a, b) =>
      dist[a] < dist[b] ? a : b
    );

    // STOP if smallest distance is infinity
    if (dist[current] === Infinity) break;

    unvisited.delete(current);

    steps.push({ type: "VISIT_NODE", node: current });

    // STOP early if target reached
    if (current === targetId) break;

    cy.getElementById(current).connectedEdges().forEach(e => {
      const neighbor =
        e.source().id() === current
          ? e.target().id()
          : e.source().id();

      if (!unvisited.has(neighbor)) return;

      const w = parseFloat(e.data("weight")) || 1;

      if (dist[current] + w < dist[neighbor]) {
        dist[neighbor] = dist[current] + w;
        prev[neighbor] = current;

        steps.push({
          type: "RELAX_EDGE",
          edge: e.id(),
        });

        steps.push({
          type: "UPDATE_DISTANCE",
          node: neighbor,
          distance: dist[neighbor],
        });
      }
    });
  }



  if (dist[targetId] !== Infinity) {
    let curr = targetId;
    const path = [];

    while (curr !== null) {
      path.push(curr);
      curr = prev[curr];
    }

    path.reverse();

    for (let i = 0; i < path.length; i++) {
      steps.push({
        type: "FINAL_PATH_NODE",
        node: path[i]
      });

      if (i < path.length - 1) {
        const edge = cy.edges().filter(e =>
          (e.source().id() === path[i] &&
           e.target().id() === path[i + 1]) ||
          (e.source().id() === path[i + 1] &&
           e.target().id() === path[i])
        )[0];

        if (edge) {
          steps.push({
            type: "FINAL_PATH_EDGE",
            edge: edge.id()
          });
        }
      }
    }
  }

  return steps;
}