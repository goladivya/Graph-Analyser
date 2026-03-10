import { StepTypes } from "../animation/StepTypes";

export function labelPropagationSteps(cy, iterations = 10) {

  const steps = [];

  const nodes = cy.nodes();

  // STEP 1: initialize each node with its own label
  nodes.forEach((node, index) => {

    node.data("community", node.id());

    steps.push({
      type: StepTypes.COLOR_NODE,
      node: node.id(),
      color: getDistinctColor(index, nodes.length)
    });

  });

  // STEP 2: propagate labels
  for (let i = 0; i < iterations; i++) {

    let changed = false;

    nodes.forEach(node => {

      const neighbors = node.connectedEdges()
        .connectedNodes()
        .filter(n => n.id() !== node.id());

      if (neighbors.length === 0) return;

      const labelCounts = {};

      neighbors.forEach(neighbor => {

        const label = neighbor.data("community");

        if (!labelCounts[label]) labelCounts[label] = 0;

        labelCounts[label]++;

      });

      // find most frequent label
      let maxLabel = null;
      let maxCount = -1;

      Object.keys(labelCounts).forEach(label => {

        if (labelCounts[label] > maxCount) {

          maxCount = labelCounts[label];
          maxLabel = label;

        }

      });

      if (maxLabel && node.data("community") !== maxLabel) {

        node.data("community", maxLabel);

        changed = true;

        const colorIndex =
          Array.from(nodes).findIndex(n => n.id() === maxLabel);

        steps.push({
          type: StepTypes.COLOR_NODE,
          node: node.id(),
          color: getDistinctColor(colorIndex, nodes.length)
        });

        steps.push({
          type: "WAIT",
          duration: 400
        });

      }

    });

    if (!changed) break;

  }

  // FINAL COMMUNITY COUNT
  const communities = new Set();

  nodes.forEach(n => communities.add(n.data("community")));

  return {

    steps,

    result: {

      algorithm: "Label Propagation Community Detection",

      totalCommunities: communities.size

    }

  };

}

function getDistinctColor(index, total) {

  const hue = (index * 360) / total;

  return `hsl(${hue}, 70%, 55%)`;

}