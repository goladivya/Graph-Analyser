import { StepTypes } from "../animation/StepTypes";

export function baModelSteps(cy, n = 15, m = 2) {

  const steps = [];

  if (m < 1 || m >= n) {
    alert("m must be >=1 and < n");
    return { steps: [], result: {} };
  }

  // clear graph
  steps.push({ type: StepTypes.CLEAR_GRAPH });

  // ---- STEP 1: create initial clique of m nodes ----
  let degreeList = []; // used for preferential selection

  for (let i = 0; i < m; i++) {
    steps.push({
      type: StepTypes.ADD_NODE,
      node: {
        id: `N${i}`,
        label: `N${i}`
      }
      
    });
  }

  // fully connect initial m nodes
  for (let i = 0; i < m; i++) {
    for (let j = i + 1; j < m; j++) {

      steps.push({
        type: StepTypes.ADD_EDGE,
        edge: {
          id: `N${i}-N${j}`,
          source: `N${i}`,
          target: `N${j}`
        }
      });

      // update degree list
      degreeList.push(`${i}`);
      degreeList.push(`${j}`);
    }
  }

  // ---- STEP 2: Add remaining nodes ----
  for (let i = m; i < n; i++) {

    steps.push({
      type: StepTypes.ADD_NODE,
      node: {
        id: `N${i}`,
        label: `N${i}`
      }
    });

    const targets = new Set();

    // preferential attachment selection
    while (targets.size < m) {

      const randomIndex = Math.floor(Math.random() * degreeList.length);
      const selectedNode = degreeList[randomIndex];

      targets.add(selectedNode);
    }

    targets.forEach(target => {

      steps.push({
        type: StepTypes.ADD_EDGE,
        edge: {
          id: `N${i}-N${target}`,
          source: `N${i}`,
          target: `N${target}`
        }
      });

      // update degree list (important!)
      degreeList.push(`${i}`);
      degreeList.push(`${target}`);
    });
  }

  steps.push({
    type: StepTypes.APPLY_LAYOUT,
    layout: "cose"
  });

  return {
    steps,
    result: {
      algorithm: "Barabasi-Albert (True Preferential Attachment)",
      totalNodes: n,
      edgesPerNewNode: m
    }
  };
}