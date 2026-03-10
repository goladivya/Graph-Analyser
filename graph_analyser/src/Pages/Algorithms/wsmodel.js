import { StepTypes } from "../animation/StepTypes";

export function wsModelSteps(cy, n, k, beta) {

  const steps = [];
  const existingEdges = new Set();

  steps.push({ type: StepTypes.CLEAR_GRAPH });

  
  for (let i = 0; i < n; i++) {
    steps.push({
      type: StepTypes.ADD_NODE,
      node: { id: `N${i}`, label: `N${i}` }
    });
  }

  const halfK = Math.floor(k / 2);

  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= halfK; j++) {

      const neighbor = (i + j) % n;
      const edgeId = getEdgeId(i, neighbor);

      if (!existingEdges.has(edgeId)) {
        existingEdges.add(edgeId);

        steps.push({
          type: StepTypes.ADD_EDGE,
          edge: {
            id: edgeId,
            source: `N${i}`,
            target: `N${neighbor}`
          }
        });
      }
    }
  }

  // Tell animation to apply circle layout
  steps.push({
    type: "APPLY_LAYOUT",
    layout: "circle"
  });

  // Small pause so students see ring clearly
  steps.push({
    type: "WAIT",
    duration: 1500
  });



  for (let i = 0; i < n; i++) {
    for (let j = 1; j <= halfK; j++) {

      if (Math.random() < beta) {

        const oldTarget = (i + j) % n;
        const oldEdgeId = getEdgeId(i, oldTarget);

        let newTarget;
        let newEdgeId;

        do {
          newTarget = Math.floor(Math.random() * n);
          newEdgeId = getEdgeId(i, newTarget);
        } while (
          newTarget === i ||
          existingEdges.has(newEdgeId)
        );

        existingEdges.delete(oldEdgeId);

        // Highlight edge before removing
        steps.push({
          type: StepTypes.COLOR_EDGE,
          edge: oldEdgeId,
          color: "red"
        });

        steps.push({
          type: StepTypes.REMOVE_EDGE,
          edgeId: oldEdgeId
        });

        existingEdges.add(newEdgeId);

        steps.push({
          type: StepTypes.ADD_EDGE,
          edge: {
            id: newEdgeId,
            source: `N${i}`,
            target: `N${newTarget}`
          }
        });

        steps.push({
          type: StepTypes.COLOR_EDGE,
          edge: newEdgeId,
          color: "orange"
        });
      }
    }
  }

  return {
    steps,
    result: {
      algorithm: "Watts-Strogatz Small World Model",
      nodes: n,
      k,
      rewiringProbability: beta
    }
  };
}

function getEdgeId(a, b) {
  return a < b ? `E${a}-${b}` : `E${b}-${a}`;
}