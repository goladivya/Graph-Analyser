import { StepTypes } from "../animation/StepTypes";

export function pageRankSteps(cy, damping = 0.85, maxIterations = 100) {
  const steps = [];
  const nodes = cy.nodes();
  const edges = cy.edges();

  const N = nodes.length;
  const ranks = {};

  nodes.forEach(n => ranks[n.id()] = 1 / N);

  for (let i = 0; i < maxIterations; i++) {
    const newRanks = {};

    nodes.forEach(n => {
      let incoming = 0;

      edges.filter(e => e.target().id() === n.id())
        .forEach(e => {
          const src = e.source().id();
          const out = edges.filter(ed => ed.source().id() === src);
          incoming += ranks[src] / (out.length || 1);
        });

      newRanks[n.id()] =
        (1 - damping) / N + damping * incoming;
    });

    Object.assign(ranks, newRanks);
  }

  nodes.forEach(n => {
    steps.push({
      type: StepTypes.UPDATE_LABEL,
      node: n.id(),
      label: `${n.id()} (${ranks[n.id()].toFixed(3)})`
    });

    steps.push({
      type: StepTypes.COLOR_NODE,
      node: n.id(),
      color: "#94b5ea"
    });
  });

  return {
    steps,
    result: {
      algorithm: "PageRank",
      results: ranks
    }
  };
}