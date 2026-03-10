import { StepTypes } from "../animation/StepTypes";

export function erModelSteps(cy, n = 10, p ) {

  const steps = [];

  // Clear graph first
  steps.push({
    type: StepTypes.CLEAR_GRAPH
  });

  // Add Nodes
  for (let i = 0; i < n; i++) {
    steps.push({
      type: StepTypes.ADD_NODE,
      node: {
        id: `N${i}`,
        label: `N${i}`
      }
    });
  }

  // Add Edges randomly
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {

      if (Math.random() < p) {
        steps.push({
          type: StepTypes.ADD_EDGE,
          edge: {
            id: `E${i}-${j}`,
            source: `N${i}`,
            target: `N${j}`
          }
        });
      }
    }
  }

  return {
    steps,
    result: {
      algorithm: "Erdos-Renyi Random Graph",
      nodes: n,
      probability: p
    }
  };
}