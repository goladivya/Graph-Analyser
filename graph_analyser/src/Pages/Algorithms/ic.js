

export function independentCascadeSteps(cy, seedNodes = [], defaultProb = 0.4) {

  const steps = [];

  // ── Validate + filter seed nodes ─────────────────────────────────────────
  const validSeeds = seedNodes
    .map(id => String(id).trim())
    .filter(id => cy.getElementById(id).length > 0);

  if (validSeeds.length === 0) {
    return {
      steps,
      result: {
        algorithm:       "Independent Cascade Model",
        error:           "No valid seed nodes found in graph.",
        totalInfluenced: 0,
        timeSteps:       0,
      },
    };
  }

  // ── State ────────────────────────────────────────────────────────────────
  // influenced: set of ALL nodes ever activated (seeds + cascaded)
  const influenced = new Set(validSeeds);
  // newlyActive: nodes activated in the CURRENT round (get to attempt edges)
  let newlyActive  = new Set(validSeeds);

  let timeStep        = 0;
  let failedAttempts  = 0;
  let successAttempts = 0;
  let cascadeDepth    = 0;  // max time step at which any activation occurred

  // ── Colour seed nodes (gold) ──────────────────────────────────────────────
  validSeeds.forEach(id => {
    steps.push({ type: "COLOR_NODE", node: id, color: "#f59e0b" });
  });

  // Brief pause so user sees the seeds before cascade starts
  steps.push({ type: "WAIT", duration: 400 });

  // ── Cascade loop ──────────────────────────────────────────────────────────
  while (newlyActive.size > 0) {

    timeStep++;
    const activatedThisRound = new Set();

    // Process each newly active node
    for (const uId of newlyActive) {
      const uNode = cy.getElementById(uId);

      // Get ALL connected edges (works for directed + undirected)
      const connectedEdges = uNode.connectedEdges();

      connectedEdges.forEach(edge => {
        const srcId = edge.source().id();
        const tgtId = edge.target().id();
        const isDirected = edge.data("directed") === true ||
                           edge.data("directed") === "true";

        // Determine the neighbour to potentially infect
        let vId = null;
        if (isDirected) {
          // Only propagate in the forward direction
          if (srcId === uId) vId = tgtId;
          else return; // don't propagate backwards on a directed edge
        } else {
          vId = srcId === uId ? tgtId : srcId;
        }

        // Skip already-influenced nodes
        if (influenced.has(vId)) return;

        // Read probability: prefer edge-level data, fall back to defaultProb
        const rawP = edge.data("probability") ?? edge.data("weight");
        const p    = rawP != null && !isNaN(parseFloat(rawP))
                     ? Math.min(1, Math.max(0, parseFloat(rawP)))
                     : defaultProb;

        // ── Attempt: highlight edge blue while "trying" ────────────────────
        steps.push({ type: "COLOR_EDGE", edge: edge.id(), color: "#3b82f6" });

        const success = Math.random() < p;

        if (success) {
          // Activate vId
          influenced.add(vId);
          activatedThisRound.add(vId);
          successAttempts++;

          // Flash node amber (just activated)
          steps.push({ type: "COLOR_NODE", node: vId, color: "#fb923c" });
          // Mark edge as successful (teal)
          steps.push({ type: "COLOR_EDGE", edge: edge.id(), color: "#0ea5e9" });

        } else {
          // Fail: edge turns red (this attempt is exhausted)
          failedAttempts++;
          steps.push({ type: "COLOR_EDGE", edge: edge.id(), color: "#ef4444" });
        }
      });
    }

    // ── End of round: settle newly activated nodes to green ─────────────────
    activatedThisRound.forEach(id => {
      steps.push({ type: "COLOR_NODE", node: id, color: "#22c55e" });
    });

    // Also settle seed nodes to green on first round
    if (timeStep === 1) {
      validSeeds.forEach(id => {
        steps.push({ type: "COLOR_NODE", node: id, color: "#22c55e" });
      });
    }

    if (activatedThisRound.size > 0) cascadeDepth = timeStep;

    newlyActive = activatedThisRound;
  }

  // ── Final: dim the failed edges so the successful path stands out ─────────
  steps.push({ type: "WAIT", duration: 300 });
  cy.edges().forEach(e => {
    // Leave successfully-coloured edges alone; only reset grey unvisited ones
    steps.push({ type: "WAIT", duration: 0 }); // no-op marker (edges coloured in animation)
  });

  return {
    steps,
    result: {
      algorithm:       "Independent Cascade Model",
      seedNodes:       validSeeds,
      seedCount:       validSeeds.length,
      totalInfluenced: influenced.size,
      totalNodes:      cy.nodes().length,
      spreadFraction:  +((influenced.size / cy.nodes().length) * 100).toFixed(1),
      timeSteps:       timeStep,
      cascadeDepth,
      successAttempts,
      failedAttempts,
      totalAttempts:   successAttempts + failedAttempts,
      influenceRate:   successAttempts + failedAttempts > 0
        ? +((successAttempts / (successAttempts + failedAttempts)) * 100).toFixed(1)
        : 0,
      defaultProbability: defaultProb,
      influencedNodes: Array.from(influenced),
    },
  };
}
