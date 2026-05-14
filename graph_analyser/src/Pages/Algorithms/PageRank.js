// PageRank – step generator
// Each animation frame updates ALL nodes with a colour heatmap + readable label

function rankColor(t) {
  // deep blue (low) → bright violet/purple (high)
  t = Math.min(1, Math.max(0, t));
  const r = Math.round(30  + t * 170);
  const g = Math.round(100 - t * 60);
  const b = Math.round(230 - t * 30);
  return `rgb(${r},${g},${b})`;
}

function nodeSize(norm) {
  // 44 px (low rank) → 80 px (top rank)
  return Math.round(44 + norm * 36);
}

export function pageRankSteps(cy, damping = 0.85, maxIterations = 60, animateEveryN = 5) {
  const steps = [];
  const nodes = cy.nodes();
  const edges = cy.edges();
  const N = nodes.length;

  if (N === 0) return { steps, result: { algorithm: 'PageRank', error: 'Empty graph' } };

  const ranks  = {};
  const outDeg = {};
  nodes.forEach(n => {
    ranks[n.id()]  = 1 / N;
    outDeg[n.id()] = edges.filter(e => e.source().id() === n.id()).length;
  });

  for (let iter = 0; iter < maxIterations; iter++) {
    const next = {};
    nodes.forEach(n => {
      let inc = 0;
      edges.filter(e => e.target().id() === n.id()).forEach(e => {
        const src = e.source().id();
        inc += ranks[src] / (outDeg[src] || 1);
      });
      next[n.id()] = (1 - damping) / N + damping * inc;
    });
    Object.assign(ranks, next);

    const shouldEmit =
      (iter + 1) % animateEveryN === 0 || iter === maxIterations - 1;

    if (shouldEmit) {
      const maxR = Math.max(...Object.values(ranks));
      nodes.forEach(n => {
        const r    = ranks[n.id()];
        const norm = maxR > 0 ? r / maxR : 0;
        steps.push({
          type:        'RANK_NODE',
          node:        n.id(),
          color:       rankColor(norm),
          borderColor: norm > 0.9 ? '#fbbf24' : '#ffffff44',
          borderWidth: norm > 0.9 ? 5 : 1,
          size:        nodeSize(norm),
          // two-line label: id top, score bottom
          label:       `${n.id()}\n${r.toFixed(4)}`,
        });
      });
      steps.push({ type: 'WAIT', duration: 40 });
    }
  }

  // crown the winner
  const sorted = Object.entries(ranks).sort((a, b) => b[1] - a[1]);
  const [winnerId, winnerRank] = sorted[0];
  steps.push({
    type:        'RANK_NODE',
    node:        winnerId,
    color:       '#f59e0b',
    borderColor: '#92400e',
    borderWidth: 6,
    size:        84,
    label:       `${winnerId}\n★ ${winnerRank.toFixed(4)}`,
  });

  return {
    steps,
    result: {
      algorithm:  'PageRank',
      ranks:      Object.fromEntries(sorted.map(([k, v]) => [k, +v.toFixed(6)])),
      topNode:    winnerId,
      topScore:   +winnerRank.toFixed(6),
      damping,
      iterations: maxIterations,
    },
  };
}
