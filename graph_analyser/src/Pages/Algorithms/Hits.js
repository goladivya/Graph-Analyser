// HITS – Hyperlink-Induced Topic Search
// Authority score  → fill colour (cool blue → warm amber)
// Hub score        → border colour (grey → indigo) + border thickness

function l2norm(obj) {
  return Math.sqrt(Object.values(obj).reduce((s, x) => s + x * x, 0));
}

// low authority = cool blue, high = warm gold
function authFill(t) {
  t = Math.min(1, Math.max(0, t));
  const r = Math.round(30  + t * 220);
  const g = Math.round(100 - t * 40);
  const b = Math.round(230 - t * 200);
  return `rgb(${r},${g},${b})`;
}

// hub border: low = neutral grey, high = vivid indigo
function hubBorder(t) {
  t = Math.min(1, Math.max(0, t));
  const r = Math.round(148 - t * 100);
  const g = Math.round(163 - t * 110);
  const b = Math.round(184 + t * 71);
  return `rgb(${r},${g},${b})`;
}

function hubBorderPx(t) { return Math.round(2 + t * 7); }
function nodeSize(authNorm, hubNorm) { return Math.round(46 + Math.max(authNorm, hubNorm) * 34); }

export function hitsSteps(cy, maxIterations = 25, tolerance = 1e-6, animateEveryN = 2) {
  const steps = [];
  const nodes = cy.nodes();
  const edges = cy.edges();

  if (nodes.length === 0)
    return { steps, result: { algorithm: 'HITS', error: 'Graph is empty' } };

  // build adjacency
  const inN = {}, outN = {};
  nodes.forEach(n => { inN[n.id()] = []; outN[n.id()] = []; });
  edges.forEach(e => {
    const u = e.source().id(), v = e.target().id();
    const directed = !!e.data('directed');
    outN[u].push(v); inN[v].push(u);
    if (!directed) { outN[v].push(u); inN[u].push(v); }
  });

  let hub = {}, auth = {};
  nodes.forEach(n => { hub[n.id()] = 1; auth[n.id()] = 1; });

  let iters = 0;
  for (; iters < maxIterations; iters++) {
    const na = {}, nh = {};
    nodes.forEach(n => { na[n.id()] = 0; nh[n.id()] = 0; });
    nodes.forEach(n => { inN[n.id()].forEach(u  => { na[n.id()] += hub[u];  }); });
    nodes.forEach(n => { outN[n.id()].forEach(v => { nh[n.id()] += auth[v]; }); });

    const aN = l2norm(na), hN = l2norm(nh);
    nodes.forEach(n => {
      if (aN > 0) na[n.id()] /= aN;
      if (hN > 0) nh[n.id()] /= hN;
    });

    let diff = 0;
    nodes.forEach(n => {
      diff += Math.abs(na[n.id()] - auth[n.id()]);
      diff += Math.abs(nh[n.id()] - hub[n.id()]);
    });
    auth = na; hub = nh;

    const shouldEmit =
      (iters + 1) % animateEveryN === 0 || iters === maxIterations - 1 || diff < tolerance;

    if (shouldEmit) {
      const maxA = Math.max(...Object.values(auth)) || 1;
      const maxH = Math.max(...Object.values(hub))  || 1;

      nodes.forEach(n => {
        const a = auth[n.id()], h = hub[n.id()];
        const aN = a / maxA, hN = h / maxH;
        steps.push({
          type:           'HITS_NODE',
          node:           n.id(),
          color:          authFill(aN),
          borderColor:    hubBorder(hN),
          hubBorderWidth: hubBorderPx(hN),
          size:           nodeSize(aN, hN),
          // two-line: id | H:xxx A:xxx
          label:          `${n.id()}\nH:${h.toFixed(3)} A:${a.toFixed(3)}`,
        });
      });
      steps.push({ type: 'WAIT', duration: 40 });
    }

    if (diff < tolerance) break;
  }

  // crowns
  const sortedAuth = Object.entries(auth).sort((a, b) => b[1] - a[1]);
  const sortedHub  = Object.entries(hub).sort((a, b)  => b[1] - a[1]);
  const [topAId] = sortedAuth[0];
  const [topHId] = sortedHub[0];

  steps.push({
    type: 'HITS_NODE', node: topAId,
    color: '#f59e0b', borderColor: '#92400e', hubBorderWidth: 7, size: 84,
    label: `${topAId}\n★Auth ${auth[topAId].toFixed(3)}`,
  });
  if (topHId !== topAId) {
    steps.push({
      type: 'HITS_NODE', node: topHId,
      color: authFill(auth[topHId] / (Math.max(...Object.values(auth)) || 1)),
      borderColor: '#4338ca', hubBorderWidth: 9, size: 80,
      label: `${topHId}\n★Hub ${hub[topHId].toFixed(3)}`,
    });
  }

  return {
    steps,
    result: {
      algorithm:    'HITS',
      authorities:  Object.fromEntries(sortedAuth.map(([k, v]) => [k, +v.toFixed(6)])),
      hubs:         Object.fromEntries(sortedHub.map( ([k, v]) => [k, +v.toFixed(6)])),
      topAuthority: topAId,
      topHub:       topHId,
      iterations:   iters,
    },
  };
}
