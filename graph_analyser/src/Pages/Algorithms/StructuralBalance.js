import { StepTypes } from '../animation/StepTypes';

/**
 * readEdgeSign – same helper used in Algorithm.jsx
 */
function readEdgeSign(edge) {
  const raw = edge.data('sign');
  if (raw !== undefined && raw !== null && raw !== '') {
    const s = String(raw).replace(/[−‒–—]/g, '-').trim();
    const n = Number(s);
    if (!Number.isNaN(n)) return n < 0 ? -1 : 1;
  }
  const w = edge.data('weight');
  if (w !== undefined && w !== null && w !== '') {
    const s = String(w).replace(/[−‒–—]/g, '-').trim();
    const wn = Number(s);
    if (!Number.isNaN(wn)) return wn < 0 ? -1 : 1;
  }
  return 1;
}

/**
 * balanceCheckSteps(cy)
 * ---------------------
 * BFS-based structural balance analysis that emits step-by-step animation.
 * Returns { steps, result }.
 *
 * Visualisation logic:
 *  1. Nodes are revealed one-by-one via BFS with partition A (blue) / B (orange)
 *  2. Each edge is highlighted yellow as it is "visited"
 *  3. After assignment, edges turn green (consistent) or red+pulse (conflict)
 */
export function balanceCheckSteps(cy) {
  const steps = [];
  const nodes = cy.nodes();

  if (nodes.length === 0) return { steps, result: null };

  const assignment = {};
  nodes.forEach(n => { assignment[n.id()] = null; });

  const conflictEdges = new Set();

  // ── BFS per component ──────────────────────────────────────────────────────
  nodes.forEach(start => {
    if (assignment[start.id()] !== null) return;

    const queue = [start.id()];
    assignment[start.id()] = 0;

    // Emit: assign start node
    steps.push({
      type: StepTypes.BALANCE_ASSIGN_NODE,
      node: start.id(),
      partition: 0,
      label: `${start.id()} [A]`
    });

    while (queue.length > 0) {
      const curId = queue.shift();
      const curNode = cy.getElementById(curId);

      curNode.connectedEdges().forEach(edge => {
        const u = edge.source().id();
        const v = edge.target().id();
        const otherId = u === curId ? v : u;
        const sign = readEdgeSign(edge);
        const desiredSame = sign === 1;

        // Flash the edge yellow as we "visit" it
        steps.push({ type: StepTypes.BALANCE_VISIT_EDGE, edge: edge.id() });

        if (assignment[otherId] === null) {
          const newPartition = desiredSame ? assignment[curId] : 1 - assignment[curId];
          assignment[otherId] = newPartition;
          queue.push(otherId);

          // Assign the neighbour node
          steps.push({
            type: StepTypes.BALANCE_ASSIGN_NODE,
            node: otherId,
            partition: newPartition,
            label: `${otherId} [${newPartition === 0 ? 'A' : 'B'}]`
          });

          // Mark edge OK (consistent by construction)
          steps.push({ type: StepTypes.BALANCE_EDGE_OK, edge: edge.id() });
        } else {
          // Check consistency
          const consistent = desiredSame
            ? assignment[otherId] === assignment[curId]
            : assignment[otherId] !== assignment[curId];

          if (consistent) {
            steps.push({ type: StepTypes.BALANCE_EDGE_OK, edge: edge.id() });
          } else {
            conflictEdges.add(edge.id());
            steps.push({ type: StepTypes.BALANCE_EDGE_CONFLICT, edge: edge.id() });
            steps.push({ type: StepTypes.PULSE_EDGE, edge: edge.id(), count: 3 });
          }
        }
      });
    }
  });

  const isBalanced = conflictEdges.size === 0;

  return {
    steps,
    result: {
      algorithm: 'Structural Balance',
      balanced: isBalanced,
      partition: assignment,
      conflicts: Array.from(conflictEdges),
      conflictCount: conflictEdges.size
    }
  };
}

/**
 * balanceGreedySteps(cy, maxIterations)
 * ---------------------------------------
 * Greedy edge-flip repair with step-by-step animation.
 * Returns { steps, result }.
 */
export function balanceGreedySteps(cy, maxIterations = 200) {
  const steps = [];

  if (!cy || cy.nodes().length === 0) return { steps, result: null };

  // ── helpers ──────────────────────────────────────────────────────────────

  const getAssignment = () => {
    const assignment = {};
    const visited = new Set();
    cy.nodes().forEach(n => { assignment[n.id()] = null; });

    cy.nodes().forEach(start => {
      if (visited.has(start.id())) return;
      const queue = [start.id()];
      assignment[start.id()] = 0;
      visited.add(start.id());

      while (queue.length) {
        const curId = queue.shift();
        cy.getElementById(curId).connectedEdges().forEach(e => {
          const u = e.source().id();
          const v = e.target().id();
          const otherId = u === curId ? v : u;
          const sign = readEdgeSign(e);
          if (!visited.has(otherId)) {
            assignment[otherId] = sign === 1 ? assignment[curId] : 1 - assignment[curId];
            visited.add(otherId);
            queue.push(otherId);
          }
        });
      }
    });
    return assignment;
  };

  const getConflicts = (assignment) => {
    const conflicts = [];
    cy.edges().forEach(e => {
      const u = e.source().id();
      const v = e.target().id();
      const sign = readEdgeSign(e);
      const ok = sign === 1 ? assignment[u] === assignment[v] : assignment[u] !== assignment[v];
      if (!ok) conflicts.push(e.id());
    });
    return conflicts;
  };

  const countConflictsWithFlip = (eid) => {
    const edge = cy.getElementById(eid);
    const cur = readEdgeSign(edge);
    edge.data('sign', cur === 1 ? -1 : 1);
    const conflicts = getConflicts(getAssignment()).length;
    edge.data('sign', cur);
    return conflicts;
  };

  // ── main loop ─────────────────────────────────────────────────────────────

  let iter = 0;
  let lastConflictCount = Infinity;

  while (iter < maxIterations) {
    const assignment = getAssignment();
    const conflicts = getConflicts(assignment);

    if (conflicts.length === 0) {
      // Already balanced – show final state
      cy.nodes().forEach(n => {
        steps.push({
          type: StepTypes.BALANCE_ASSIGN_NODE,
          node: n.id(),
          partition: assignment[n.id()],
          label: `${n.id()} [${assignment[n.id()] === 0 ? 'A' : 'B'}]`
        });
      });
      cy.edges().forEach(e => {
        steps.push({ type: StepTypes.BALANCE_EDGE_OK, edge: e.id() });
      });
      return {
        steps,
        result: { algorithm: 'Structural Balance (Greedy)', balanced: true, iterations: iter, remainingConflicts: 0, partition: assignment, conflicts: [] }
      };
    }

    // Show current assignment + conflict highlights
    cy.nodes().forEach(n => {
      steps.push({
        type: StepTypes.BALANCE_ASSIGN_NODE,
        node: n.id(),
        partition: assignment[n.id()],
        label: `${n.id()}`
      });
    });
    cy.edges().forEach(e => {
      if (conflicts.includes(e.id())) {
        steps.push({ type: StepTypes.BALANCE_EDGE_CONFLICT, edge: e.id() });
      } else {
        steps.push({ type: StepTypes.BALANCE_EDGE_OK, edge: e.id() });
      }
    });

    // Evaluate flips
    const candidates = conflicts.map(eid => ({
      eid,
      delta: countConflictsWithFlip(eid) - conflicts.length
    })).sort((a, b) => a.delta - b.delta);

    if (candidates.length === 0) break;
    const best = candidates[0];

    // Apply best flip
    const edge = cy.getElementById(best.eid);
    const curSign = readEdgeSign(edge);
    const newSign = curSign === 1 ? -1 : 1;
    edge.data('sign', newSign);

    steps.push({
      type: StepTypes.BALANCE_EDGE_FLIP,
      edge: best.eid,
      label: newSign > 0 ? '+1' : '-1'
    });
    steps.push({ type: StepTypes.WAIT, duration: 100 });

    const newConflicts = getConflicts(getAssignment()).length;
    if (newConflicts >= lastConflictCount && iter > 0) break;
    lastConflictCount = newConflicts;
    iter++;
  }

  // Final state
  const finalAssignment = getAssignment();
  const finalConflicts = getConflicts(finalAssignment);

  cy.nodes().forEach(n => {
    steps.push({
      type: StepTypes.BALANCE_ASSIGN_NODE,
      node: n.id(),
      partition: finalAssignment[n.id()],
      label: `${n.id()} [${finalAssignment[n.id()] === 0 ? 'A' : 'B'}]`
    });
  });
  cy.edges().forEach(e => {
    if (finalConflicts.includes(e.id())) {
      steps.push({ type: StepTypes.BALANCE_EDGE_CONFLICT, edge: e.id() });
      steps.push({ type: StepTypes.PULSE_EDGE, edge: e.id(), count: 2 });
    } else {
      steps.push({ type: StepTypes.BALANCE_EDGE_OK, edge: e.id() });
    }
  });

  return {
    steps,
    result: {
      algorithm: 'Structural Balance (Greedy)',
      balanced: finalConflicts.length === 0,
      iterations: iter,
      remainingConflicts: finalConflicts.length,
      partition: finalAssignment,
      conflicts: finalConflicts
    }
  };
}
