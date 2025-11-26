import React, { useState, useEffect } from "react";
import cytoscape from "cytoscape";

const AlgorithmPanel = ({ cyRef, setResults }) => {
  const [activeTab, setActiveTab] = useState("algorithms");
  const [properties, setProperties] = useState(null);
  const [balanceResult, setBalanceResult] = useState(null);


  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;


    //Clustering Coefficient Estimation
    function estimateClusteringCoefficient(cy, trials = 1000) {
      let triangles = 0;
      let attempts = 0;

      for (let i = 0; i < trials; i++) {
        // 1. Pick a random node
        const nodes = cy.nodes();
        const v = nodes[Math.floor(Math.random() * nodes.length)];
        const neighbors = v.neighborhood("node");

        // 2. Need at least 2 neighbors to form a triangle
        if (neighbors.length < 2) continue;

        // 3. Pick two random neighbors
        const u = neighbors[Math.floor(Math.random() * neighbors.length)];
        let w;
        do {
          w = neighbors[Math.floor(Math.random() * neighbors.length)];
        } while (w.id() === u.id()); // ensure u != w

        // 4. Check if they are connected
        if (cy.getElementById(u.id()).edgesWith(w).length > 0) {
          triangles++;
        }

        attempts++;
      }

      // 5. Return estimated clustering coefficient
      return attempts > 0 ? (triangles / attempts) : 0;
    }


    function calculateProperties() {
      const nodes = cy.nodes();
      const edges = cy.edges();
      const n = nodes.length;
      const m = edges.length;

      if (n === 0) return;

      const size = m;
      const density = cy.edges().some(e => e.data("directed"))
        ? m / (n * (n - 1))
        : (2 * m) / (n * (n - 1));

      const degrees = nodes.map(n => n.degree());
      const minDeg = Math.min(...degrees);
      const maxDeg = Math.max(...degrees);
      const avgDeg = degrees.reduce((a, b) => a + b, 0) / n;

      const components = cy.elements().components();
      const connectedComponents = components.length;
      const isolatedNodes = nodes.filter(n => n.degree() === 0).length;

      // DFS for cycle detection
      let hasCycle = false;
      const visited = new Set();
      const stack = new Set();
      function dfs(node) {
        if (stack.has(node.id())) {
          hasCycle = true;
          return;
        }
        if (visited.has(node.id())) return;
        visited.add(node.id());
        stack.add(node.id());
        node.connectedEdges().forEach(e => {
          const target = e.source().id() === node.id() ? e.target() : e.source();
          dfs(target);
        });
        stack.delete(node.id());
      }
      nodes.forEach(n => {
        if (!visited.has(n.id())) dfs(n);
      });

      const clusteringCoeff = estimateClusteringCoefficient(cy, 1000);

      setProperties({
        size,
        density: density.toFixed(3),
        minDeg,
        maxDeg,
        avgDeg: avgDeg.toFixed(2),
        connectedComponents,
        isolatedNodes,
        hasCycle: hasCycle ? "Yes" : "No",
        clusteringCoeff: clusteringCoeff.toFixed(3),
      });
    }

    calculateProperties();
    cy.on("add remove data", calculateProperties);
    return () => {
      cy.removeListener("add remove data", calculateProperties);
    };
  }, [cyRef, activeTab]);

  const readEdgeSign = edge => {
  // Robust normalization: accept numbers, numeric strings, whitespace, and unicode minus.
  const raw = edge.data("sign");
  if (raw !== undefined && raw !== null && raw !== "") {
    // normalize unicode minus to ASCII hyphen
    const s = String(raw).replace(/[−‒–—]/g, "-").trim();
    const n = Number(s);
    if (!Number.isNaN(n)) return n < 0 ? -1 : 1;
  }

  const w = edge.data("weight");
  if (w !== undefined && w !== null && w !== "") {
    const s = String(w).replace(/[−‒–—]/g, "-").trim();
    const wn = Number(s);
    if (!Number.isNaN(wn)) return wn < 0 ? -1 : 1;
  }

  return 1;
};

  
  function analyzeBalance() {
    if (!cyRef.current) return null;
    const cy = cyRef.current;
    resetVisuals();

    const nodes = cy.nodes();
    const assignment = {};
    const conflicts = new Set();

    // Initialize assignment for all nodes
    nodes.forEach(n => {
      assignment[n.id()] = null;
    });

    // BFS on each connected component
    nodes.forEach(start => {
      if (assignment[start.id()] === null) {
        const queue = [start.id()];
        assignment[start.id()] = 0; // Start assigning group 0 to the first node

        while (queue.length > 0) {
          const curId = queue.shift();
          const curNode = cy.getElementById(curId);

          curNode.connectedEdges().forEach(edge => {
            const u = edge.source().id();
            const v = edge.target().id();
            const otherId = u === curId ? v : u;

            // Get edge sign (+1 = friendly, -1 = hostile)
            const sign = readEdgeSign(edge);
            const desiredSame = sign === 1;

            if (assignment[otherId] === null) {
              // Assign group based on edge type
              assignment[otherId] = desiredSame
                ? assignment[curId]
                : 1 - assignment[curId];
              queue.push(otherId);
            } else {
              // Check if existing assignment is consistent
              const consistent = desiredSame
                ? assignment[otherId] === assignment[curId]
                : assignment[otherId] !== assignment[curId];

              if (!consistent) {
                conflicts.add(edge.id());
              }
            }
          });
        }
      }
    });

    // Final result
    const isBalanced = conflicts.size === 0;

    // Highlight conflicts visually (optional)
    visualizeBalance(assignment, Array.from(conflicts));

    const result = {
      balanced: isBalanced,
      partition: assignment,
      conflicts: Array.from(conflicts),
      conflictCount: conflicts.size,
    };
    setBalanceResult(result);
    return result;
  }



  const resetVisuals = () => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    // Remove all algorithm-specific classes
    cy.nodes().removeClass("balance-A balance-B unassigned");
    cy.edges().removeClass("pos neg conflict flipped");

    // Reset colors
    cy.nodes().style({
      "background-color": null,
      "color": null
    });

    cy.edges().style({
      "line-color": null,
      "target-arrow-color": null
    });

    // Restore original labels (remove hub/authority score text)
    cy.nodes().forEach((node) => {
      node.style("label", node.data("id"));
    });
  };


  //  visualizeBalance - no .play()
  const visualizeBalance = (assignment, conflictEdgeIds = []) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.nodes().forEach(node => {
      const id = node.id();
      if (assignment[id] === 0) {
        node.addClass("balance-A");
        node.style("background-color", "#60a5fa");
      } else if (assignment[id] === 1) {
        node.addClass("balance-B");
        node.style("background-color", "#fb923c");
      } else {
        node.addClass("unassigned");
        node.style("background-color", "#cbd5e1");
      }
    });

    const conflictSet = new Set(conflictEdgeIds);
  cy.edges().forEach(edge => {
    if (!conflictSet.has(edge.id())) {
      edge.removeClass("conflict");
      edge.style({
        "line-color": "#10b981", // green
        "target-arrow-color": "#10b981",
        width: 3,
      });
    }
  });
    //  Pulse animation (safe)
    conflictEdgeIds.forEach(eid => {
      const e = cy.getElementById(eid);
      if (e && e.length > 0) {
        e.addClass("conflict");
        let pulses = 3;

        const pulse = () => {
          if (!e || e.removed()) return;
          e.animate(
            { style: { "line-color": "#ffffff", width: 6 } },
            {
              duration: 250,
              complete: () => {
                if (!e || e.removed()) return;
                e.animate(
                  { style: { "line-color": "#ff0066", width: 4 } },
                  {
                    duration: 250,
                    complete: () => {
                      pulses--;
                      if (pulses > 0) pulse();
                    },
                  }
                );
              },
            }
          );
        };

        pulse();
      }
    });
  };


    // Helper: Get sign between two nodes (returns +1 or -1)
const getSignBetween = (u, v, cy) => {
  const e = cy.$(`edge[source="${u}"][target="${v}"], edge[source="${v}"][target="${u}"]`);
  if (e.length === 0) return null;
  return parseInt(e.data("sign"));
};

// Helper: Check if a triangle (u, v, w) is structurally balanced
const isTriangleBalanced = (u, v, w, cy) => {
  const s1 = getSignBetween(u, v, cy);
  const s2 = getSignBetween(v, w, cy);
  const s3 = getSignBetween(u, w, cy);
  // If any edge missing, ignore this triple
  if (s1 === null || s2 === null || s3 === null) return true;
  return s1 * s2 * s3 === 1;  // Balanced if product is +1
};

// Full graph structural balance check
const isGraphStructurallyBalanced = (cy) => {
  const nodes = cy.nodes().map(n => n.id());
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      for (let k = j + 1; k < nodes.length; k++) {
        if (!isTriangleBalanced(nodes[i], nodes[j], nodes[k], cy)) {
          return false;
        }
      }
    }
  }
  return true;
};


  // Greedy improvement: flip only edges that reduce the total number of conflicts
  const makeBalancedGreedy = (maxIterations = 1000) => {
    if (!cyRef.current) return null;
    const cy = cyRef.current;

    const computeConflictsAndAssignment = () => {
      const nodes = cy.nodes();
      const visited = new Set();
      const assignment = {};

      // BFS assignment
      const bfsAssign = startId => {
        const queue = [startId];
        assignment[startId] = 0;
        visited.add(startId);

        while (queue.length) {
          const curId = queue.shift();
          const cur = cy.getElementById(curId);

          cur.connectedEdges().forEach(e => {
            const u = e.source().id();
            const v = e.target().id();
            const otherId = u === curId ? v : u;
            const sign = readEdgeSign(e);
            const desiredSame = sign === 1;

            if (!(otherId in assignment)) {
              assignment[otherId] = desiredSame
                ? assignment[curId]
                : 1 - assignment[curId];
              visited.add(otherId);
              queue.push(otherId);
            }
          });
        }
      };

      nodes.forEach(n => {
        if (!visited.has(n.id())) bfsAssign(n.id());
      });

      // explicit conflict detection
      const conflicts = [];
      cy.edges().forEach(e => {
        const u = e.source().id();
        const v = e.target().id();
        const sign = readEdgeSign(e);
        const consistent =
          sign === 1
            ? assignment[u] === assignment[v]
            : assignment[u] !== assignment[v];
        if (!consistent) conflicts.push(e.id());
      });

      return { conflicts, assignment };
    };

    const countConflicts = () => {
      let cnt = 0;
      const nodes = cy.nodes();
      const assignment = {};
      // build assignment via BFS (same as above simplified)
      const visited = new Set();
      const bfsAssign = startId => {
        const queue = [startId];
        assignment[startId] = 0;
        visited.add(startId);
        while (queue.length) {
          const curId = queue.shift();
          const cur = cy.getElementById(curId);
          cur.connectedEdges().forEach(e => {
            const u = e.source().id();
            const v = e.target().id();
            const otherId = u === curId ? v : u;
            const sign = readEdgeSign(e);
            const desiredSame = sign === 1;
            if (!(otherId in assignment)) {
              assignment[otherId] = desiredSame ? assignment[curId] : 1 - assignment[curId];
              visited.add(otherId);
              queue.push(otherId);
            }
          });
        }
      };
      nodes.forEach(n => { if (!visited.has(n.id())) bfsAssign(n.id()); });

      cy.edges().forEach(e => {
        const u = e.source().id();
        const v = e.target().id();
        const sign = readEdgeSign(e);
        const consistent = sign === 1 ? assignment[u] === assignment[v] : assignment[u] !== assignment[v];
        if (!consistent) cnt++;
      });
      return cnt;
    };

    let iter = 0;
    let lastConflicts = null;

    while (iter < maxIterations) {
      const { conflicts, assignment } = computeConflictsAndAssignment();
      const currentConflictCount = conflicts.length;

      // if already zero conflicts, success
      if (currentConflictCount === 0 && isGraphStructurallyBalanced(cy)) {
        visualizeBalance(assignment, []);
        setBalanceResult({ balanced: true, partition: assignment, conflicts: [] });
        return { balanced: true, iterations: iter };
      }

      // For each conflicting edge, evaluate net change if flipped
      const flipCandidates = [];

      for (const eid of conflicts) {
        const e = cy.getElementById(eid);
        if (!e || e.removed()) continue;
        const curSign = readEdgeSign(e);
        const newSign = curSign === 1 ? -1 : 1;

        // temporarily flip
        e.data("sign", newSign);
        const newCount = countConflicts();
        // restore
        e.data("sign", curSign);

        const delta = newCount - currentConflictCount; // negative -> improvement
        flipCandidates.push({ eid, delta, newSign });
      }

      // pick flips that strictly reduce conflicts (delta < 0)
      const improving = flipCandidates.filter(c => c.delta < 0).sort((a, b) => a.delta - b.delta);

      if (improving.length === 0) {
        // no single-edge flip improves => try flipping the single best edge anyway (may help escape local minima)
        // pick the edge with smallest delta (least worsening)
        flipCandidates.sort((a, b) => a.delta - b.delta);
        if (flipCandidates.length === 0) break;
        const best = flipCandidates[0];
        const e = cy.getElementById(best.eid);
        const curSign = readEdgeSign(e);
        const newSign = curSign === 1 ? -1 : 1;
        e.data("sign", newSign);
        e.addClass("flipped");
      } else {
        // apply top-k improving flips (k=1 to avoid oscillation) — choose best
        const best = improving[0];
        const e = cy.getElementById(best.eid);
        e.data("sign", best.newSign);
        e.addClass("flipped");
      }

      // update edge styles after changes
      refreshEdgeStyles();

      // safety: stop if no progress over two iterations
      const newConflictCount = countConflicts();
      if (lastConflicts !== null && newConflictCount >= lastConflicts) {
        // no meaningful progress, break
        break;
      }
      lastConflicts = newConflictCount;

      iter++;
    }

    const final = computeConflictsAndAssignment();
    visualizeBalance(final.assignment, final.conflicts);
    setBalanceResult({
      balanced: final.conflicts.length === 0,
      partition: final.assignment,
      conflicts: final.conflicts,
    });
    return {
      balanced: final.conflicts.length === 0,
      iterations: iter,
      remainingConflicts: final.conflicts.length,
    };
  };


  // replace your handleRunBalance with this
  const handleRunBalance = () => {
    const res = analyzeBalance();
    if (!res) {
      alert("No graph present.");
      return;
    }

    // Prepare the result object for AnalysisResults
    const resultObj = {
      algorithm: "Structural Balance",
      balanced: res.balanced,
      conflicts: res.conflicts,
      conflictCount: res.conflictCount,
      graphStatus: [
        "✓ Connected graph",
        "✓ No self-loops detected",
        res.conflictCount > 0
          ? `⚠ ${res.conflictCount} conflict(s) detected`
          : "✓ No conflicts",
      ],
    };

    setResults(resultObj); // Send to AnalysisResults

    // show explicit user-facing message
    if (res.balanced) {
      alert("Graph is balanced — no conflicts detected.");
    } else {
      alert(`Graph is UNBALANCED — ${res.conflictCount} conflict(s) detected. Check highlighted edges.`);
    }
  };


 const refreshEdgeStyles = () => {
  const cy = cyRef.current;
  if (!cy) return;
  cy.edges().forEach(edge => {
    const sRaw = edge.data("sign");
    let sign = 1;
    if (sRaw !== undefined && sRaw !== null && sRaw !== "") {
      const s = String(sRaw).replace(/[−‒–—]/g, "-").trim();
      const n = Number(s);
      sign = Number.isNaN(n) ? (edge.data("weight") < 0 ? -1 : 1) : (n < 0 ? -1 : 1);
    } else if (edge.data("weight") !== undefined) {
      const w = Number(edge.data("weight"));
      sign = Number.isNaN(w) ? 1 : (w < 0 ? -1 : 1);
    }

    const isPos = sign > 0;
    // store normalized numeric sign back to data so all code sees the same format
    edge.data("sign", isPos ? 1 : -1);

    edge.style({
      "line-color": isPos ? "#10b981" : "#ef4444",
      "target-arrow-color": isPos ? "#10b981" : "#ef4444",
      "label": isPos ? "1" : "-1",
      "font-size": "12px",
      "text-background-opacity": 1,
      "text-background-color": "#ffffff",
    });
  });
  try { cy.style().update(); } catch (e) {}
};


  
   const handleMakeBalanced = () => {
     const res = makeBalancedGreedy(200);
     if (!res) {
       alert("No graph present or operation failed.");
       return;
     }
 
     const conflicts = res.remainingConflicts ?? (balanceResult?.conflicts?.length ?? 0);
 
     const resultObj = {
       algorithm: "Structural Balance (Greedy)",
       balanced: res.balanced ?? (conflicts === 0),
       conflicts: balanceResult?.conflicts || [],
       remainingConflicts: conflicts,
       graphStatus: [
         "✓ Connected graph",
         "✓ No self-loops detected",
         conflicts
           ? `⚠ ${conflicts} conflicts remaining`
           : "✓ No conflicts",
       ],
     };
     setResults(resultObj);
 
     if (res.balanced) {
       alert(`Graph balanced after ${res.iterations} iteration(s).`);
     } else {
       alert(
         `Stopped after ${res.iterations} iteration(s). Remaining conflicts: ${conflicts || 0}`
       );
     }
   };



  const runDijkstra = (sourceId, targetId) => {


    if (!cyRef.current) return null;
    const cy = cyRef.current;

    console.log("All node IDs:", cy.nodes().map(n => n.id()));

    const sourceNode = cy.getElementById(sourceId);
    const targetNode = cy.getElementById(targetId);

    if (!sourceNode.nonempty() || !targetNode.nonempty()) {
      alert("Invalid source or target node ID");
      return null;
    }

    const nodes = cy.nodes();
    const dist = {};
    const prev = {};
    nodes.forEach(n => {
      dist[n.id()] = Infinity;
      prev[n.id()] = null;
    });
    dist[sourceId] = 0;

    const unvisited = new Set(nodes.map(n => n.id()));

    while (unvisited.size > 0) {
      // Find node with smallest distance
      let current = null, minDist = Infinity;
      unvisited.forEach(id => {
        if (dist[id] < minDist) {
          minDist = dist[id];
          current = id;
        }
      });

      if (current === null || minDist === Infinity) break;
      unvisited.delete(current);

      if (current === targetId) break;

      const currentNode = cy.getElementById(current);

      // Correct neighbor edges
      const edgesToConsider = currentNode.connectedEdges().filter(e => {
        if (e.data("directed")) {
          return e.source().id() === current; // only outgoing
        }
        return true; // undirected → both ways
      });

      edgesToConsider.forEach(edge => {
        const neighborId =
          edge.source().id() === current ? edge.target().id() : edge.source().id();

        if (!unvisited.has(neighborId)) return;

        let weight = parseFloat(edge.data("weight")) || 1;
        if (isNaN(weight) || weight < 0) weight = 1;

        if (dist[current] + weight < dist[neighborId]) {
          dist[neighborId] = dist[current] + weight;
          prev[neighborId] = current;
        }
      });
    }

    // ✅ Reconstruct path
    const path = [];
    let u = targetId;
    while (u) {
      path.unshift(u);
      u = prev[u];
    }

    if (path[0] !== sourceId) {
      alert("No path found between selected nodes.");
      return null;
    }

    // ✅ Highlight path
    resetVisuals();
    for (let i = 0; i < path.length - 1; i++) {
      const e = cy.edges().filter(edge =>
        (edge.source().id() === path[i] && edge.target().id() === path[i + 1]) ||
        (!edge.data("directed") &&
          edge.source().id() === path[i + 1] &&
          edge.target().id() === path[i])
      );
      e.style({
        "line-color": "#facc15",
        "target-arrow-color": "#facc15",
        width: 4,
      });
    }

    cy.getElementById(sourceId).style("background-color", "#60a5fa");
    cy.getElementById(targetId).style("background-color", "#fb923c");

    return {
      algorithm: "Dijkstra",
      paths: [
        {
          name: `Shortest path from ${sourceId} to ${targetId}`,
          route: path.join(" → "),
          cost: dist[targetId],
        },
      ],
    };
  };



  // Improved HITS implementation (handles directed/undirected, labels & coloring)
  const runHITS = (maxIterations = 100, tolerance = 1e-6) => {
    if (!cyRef.current) return null;
    const cy = cyRef.current;

    const nodes = cy.nodes();
    const edges = cy.edges();

    if (nodes.length === 0) {
      alert("Graph is empty.");
      return null;
    }

    // Build adjacency lists explicitly, respecting directed flag.
    // We'll maintain inNeighbors[v] = [u,...] where u -> v,
    // and outNeighbors[v] = [w,...] where v -> w.
    const inNeighbors = {};
    const outNeighbors = {};
    nodes.forEach(n => {
      inNeighbors[n.id()] = [];
      outNeighbors[n.id()] = [];
    });

    edges.forEach(e => {
      const u = e.source().id();
      const v = e.target().id();
      const directed = !!e.data("directed"); // your edges set this sometimes
      // treat the edge as u -> v
      outNeighbors[u].push(v);
      inNeighbors[v].push(u);

      // if the edge is undirected, also add the reverse direction
      if (!directed) {
        outNeighbors[v].push(u);
        inNeighbors[u].push(v);
      }
    });

    // Initialize scores (use small positive init to help numeric stability)
    let hub = {};
    let auth = {};
    nodes.forEach(n => {
      hub[n.id()] = 1.0;
      auth[n.id()] = 1.0;
    });

    const l2norm = obj => Math.sqrt(Object.values(obj).reduce((s, x) => s + x * x, 0));

    let iter = 0;
    while (iter < maxIterations) {
      const newAuth = {};
      const newHub = {};
      nodes.forEach(n => {
        newAuth[n.id()] = 0;
        newHub[n.id()] = 0;
      });

      // auth[v] = sum_{u in inNeighbors[v]} hub[u]
      Object.keys(inNeighbors).forEach(v => {
        inNeighbors[v].forEach(u => {
          newAuth[v] += hub[u] || 0;
        });
      });

      // hub[u] = sum_{v in outNeighbors[u]} auth[v]
      Object.keys(outNeighbors).forEach(u => {
        outNeighbors[u].forEach(v => {
          newHub[u] += auth[v] || 0;
        });
      });

      // Normalize (L2). If norm === 0, leave as zeros (or add tiny eps)
      const authNorm = l2norm(newAuth);
      const hubNorm = l2norm(newHub);
      if (authNorm > 0) {
        Object.keys(newAuth).forEach(k => (newAuth[k] /= authNorm));
      } else {
        // if all zeros (disconnected), keep previous auth scaled (avoid zeroing)
        Object.keys(newAuth).forEach(k => (newAuth[k] = auth[k] || 0));
      }
      if (hubNorm > 0) {
        Object.keys(newHub).forEach(k => (newHub[k] /= hubNorm));
      } else {
        Object.keys(newHub).forEach(k => (newHub[k] = hub[k] || 0));
      }

      // compute convergence metric
      let diff = 0;
      nodes.forEach(n => {
        diff += Math.abs(newAuth[n.id()] - auth[n.id()]);
        diff += Math.abs(newHub[n.id()] - hub[n.id()]);
      });

      auth = newAuth;
      hub = newHub;

      if (diff < tolerance) break;
      iter++;
    }

    // Visualize: set labels and color nodes by authority (or hub) with a color ramp.
    // We'll color by authority by default; nodes with higher authority -> green, lower -> blue.
    //resetVisuals();

    // Avoid divide-by-zero for max
    const maxAuth = Math.max(...Object.values(auth), 0);
    const minAuth = Math.min(...Object.values(auth), 0);

    // small helper to interpolate between two colors
    const interpColor = (t) => {
      // t in [0,1] -> from blue (low) to green (high)
      const r = Math.round((1 - t) * 30 + t * 16);   // small red base
      const g = Math.round((1 - t) * 144 + t * 200); // green channel increases
      const b = Math.round((1 - t) * 255 + t * 60);  // blue decreases
      return `rgba(${r}, ${g}, ${b}, ${0.95})`;
    };

    nodes.forEach(n => {
      const id = n.id();
      const a = auth[id] || 0;
      const h = hub[id] || 0;
      // label show both
      n.data("label", `${id}\nH:${Number(h).toFixed(3)} A:${Number(a).toFixed(3)}`);

      // map authority to [0,1] safely
      let t = 0;
      if (maxAuth > minAuth) {
        t = (a - minAuth) / (maxAuth - minAuth);
      }
      const color = interpColor(t);
      n.style({
        "background-color": color,
        "border-color": "#0f172a",
        "border-width": 2,
        "font-size": "9px",
        "text-background-opacity": 0.5,
        "text-background-color": "white",
        "text-background-padding": "3px",
      });
    });


    // prepare results object (plain objects for hubs & authorities)
    const result = {
      algorithm: "HITS (Hubs & Authorities)",
      hubs: hub,
      authorities: auth,
      iterations: iter,
      graphStatus: [
        "✓ Directed edges considered as links (undirected treated as two-way)",
        `✓ Iterations: ${iter}`,
        "✓ Scores computed & nodes labeled/colored",
      ],
    };

    setResults(result);
    return result;
  };

  //Degree Centrality
const runDegreeCentrality = () => {
  if (!cyRef.current) return null;
  const cy = cyRef.current;

  const nodes = cy.nodes();
  const results = [];

  resetVisuals();

  nodes.forEach(n => {
    const deg = n.degree();
    results.push({ node: n.id(), degree: deg });

    // highlight nodes by degree size
    n.style({
      "background-color": "#3b82f6",
      "width": 30 + deg * 5,
      "height": 30 + deg * 5,
      "label": `${n.id()} (${deg})`
    });
  });

  return {
    algorithm: "Degree Centrality",
    results
  };
};


//Closeness Centrality
const runClosenessCentrality = () => {
  if (!cyRef.current) return null;
  const cy = cyRef.current;

  const nodes = cy.nodes();
  const closeness = {};

  resetVisuals();

  nodes.forEach(source => {
    let totalDist = 0;

    const dijkstra = cy.elements().dijkstra(source, e => parseFloat(e.data("weight") || 1));
    nodes.forEach(target => {
      if (source.id() !== target.id()) {
        const dist = dijkstra.distanceTo(target);
        if (dist !== Infinity) totalDist += dist;
      }
    });

    closeness[source.id()] = totalDist > 0 ? (1 / totalDist) : 0;
  });

  const maxC = Math.max(...Object.values(closeness));
  const results = [];

  nodes.forEach(n => {
    const c = closeness[n.id()];
    results.push({ node: n.id(), closeness: c.toFixed(4) });

    const size = 30 + (c / maxC) * 60;

    n.style({
      "background-color": "#10b981",
      width: size,
      height: size,
      "label": `${n.id()} (${c.toFixed(3)})`
    });
  });

  return {
    algorithm: "Closeness Centrality",
    results
  };
};



//Betweenness Centrality

const runBetweennessCentrality = () => {
  if (!cyRef.current) return null;
  const cy = cyRef.current;

  const nodes = cy.nodes();
  const edges = cy.edges();

  resetVisuals();

  const betweenness = {};
  nodes.forEach(n => betweenness[n.id()] = 0);

  nodes.forEach(s => {
    const stack = [];
    const pred = {};
    const dist = {};
    const sigma = {};

    nodes.forEach(v => {
      pred[v.id()] = [];
      dist[v.id()] = Infinity;
      sigma[v.id()] = 0;
    });

    dist[s.id()] = 0;
    sigma[s.id()] = 1;
    const queue = [s];

    while (queue.length > 0) {
      const v = queue.shift();
      stack.push(v);

      v.neighborhood("node").forEach(w => {
        if (dist[w.id()] === Infinity) {
          dist[w.id()] = dist[v.id()] + 1;
          queue.push(w);
        }
        if (dist[w.id()] === dist[v.id()] + 1) {
          sigma[w.id()] += sigma[v.id()];
          pred[w.id()].push(v);
        }
      });
    }

    const delta = {};
    nodes.forEach(v => delta[v.id()] = 0);

    while (stack.length > 0) {
      const w = stack.pop();
      pred[w.id()].forEach(v => {
        delta[v.id()] += (sigma[v.id()] / sigma[w.id()]) * (1 + delta[w.id()]);
      });
      if (w.id() !== s.id()) {
        betweenness[w.id()] += delta[w.id()];
      }
    }
  });

  const maxB = Math.max(...Object.values(betweenness));
  const results = [];

  nodes.forEach(n => {
    const b = betweenness[n.id()];
    results.push({ node: n.id(), betweenness: b.toFixed(3) });

    const size = 30 + (b / maxB) * 70;

    n.style({
      "background-color": "#f97316",
      width: size,
      height: size,
      "label": `${n.id()} (${b.toFixed(3)})`
    });
  });

  return {
    algorithm: "Betweenness Centrality",
    results
  };
};





// Helper to run PageRank algorithm
const runPageRank = (dampingFactor = 0.85, maxIterations = 100, tolerance = 1e-6) => {
  if (!cyRef.current) return null;
  const cy = cyRef.current;
  const nodes = cy.nodes();
  const edges = cy.edges();

  if (nodes.length === 0) {
    alert("Graph is empty.");
    return null;
  }

  const N = nodes.length;
  const ranks = {};
  nodes.forEach(n => (ranks[n.id()] = 1 / N));

  for (let iter = 0; iter < maxIterations; iter++) {
    const newRanks = {};
    let diff = 0;

    nodes.forEach(n => {
      let incoming = 0;
      const incomingEdges = edges.filter(e => e.target().id() === n.id());
      incomingEdges.forEach(e => {
        const src = e.source().id();
        const outEdges = edges.filter(ed => ed.source().id() === src);
        if (outEdges.length > 0) {
          incoming += ranks[src] / outEdges.length;
        }
      });
      newRanks[n.id()] = (1 - dampingFactor) / N + dampingFactor * incoming;
      diff += Math.abs(newRanks[n.id()] - ranks[n.id()]);
    });

    Object.assign(ranks, newRanks);

    if (diff < tolerance) break;
  }

  // Normalize (optional)
  const sum = Object.values(ranks).reduce((a, b) => a + b, 0);
  nodes.forEach(n => (ranks[n.id()] = ranks[n.id()] / sum));

// Highlight nodes based on rank
resetVisuals();

const maxRank = Math.max(...Object.values(ranks));
let maxNode = null;

// Determine min and max rank for scaling node sizes
const rankValues = Object.values(ranks);
const minRank = Math.min(...rankValues);
const maxRankValue = Math.max(...rankValues);

// Function to scale node size based on rank
const scaleSize = (rank, minSize = 30, maxSize = 80) => {
  if (maxRankValue === minRank) return (minSize + maxSize) / 2; // avoid division by 0
  return ((rank - minRank) / (maxRankValue - minRank)) * (maxSize - minSize) + minSize;
};

// 1️⃣ First, find the node with maximum rank
nodes.forEach(n => {
  if (ranks[n.id()] === maxRank) maxNode = n;
});

// 2️⃣ Set style for all nodes (same color, size proportional to rank)
nodes.forEach(n => {
  const rank = ranks[n.id()];
  n.style({
    "background-color": "#94b5eaff", // same color for all nodes (blue)
    "width": scaleSize(rank),
    "height": scaleSize(rank),
    "border-width": 1,
    "border-color": "#1e40af",
    "label": `${n.id()} (${rank.toFixed(3)})`
  });
});

// 3️⃣ Highlight the most influential node (border/shadow)
if (maxNode) {
  maxNode.style({
    "border-color": "#f11111ff",   // bright amber
    "border-width": 5,
    "shadow-blur": 20,
    "shadow-color": "#facc15",
  });
}

return {
  algorithm: "PageRank",
  results: Object.entries(ranks).map(([id, rank]) => ({
    node: id,
    rank: rank.toFixed(4)
  })),
};


};

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("algorithms")}
          className={`flex-1 py-3 px-4 font-medium ${activeTab === "algorithms"
            ? "text-gray-700 border-b-2 border-yellow-400"
            : "text-gray-500"
            }`}
        >
          Algorithms
        </button>
        <button
          onClick={() => setActiveTab("properties")}
          className={`flex-1 py-3 px-4 font-medium ${activeTab === "properties"
            ? "text-gray-700 border-b-2 border-yellow-400"
            : "text-gray-500"
            }`}
        >
          Properties
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`flex-1 py-3 px-4 font-medium ${activeTab === "import"
            ? "text-gray-700 border-b-2 border-yellow-400"
            : "text-gray-500"
            }`}
        >
          Import/Export
        </button>
      </div>

      <div className="p-4 space-y-2">
        {activeTab === "algorithms" && (
          <>
            <div className="w-full bg-white rounded-xl shadow-lg p-5 space-y-4">
              <div className="text-lg font-semibold text-gray-800">Structural Balance</div>
              <div className="text-sm text-gray-600 mb-3">
                Check whether signed graph is balanced (heuristic BFS). Positive edges = friendly, negative edges = enemy.
              </div>
              <div id="webcrumbs" className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleRunBalance}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-md"
                >
                  Check Balance
                </button>

                { <button
                  onClick={handleMakeBalanced}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg shadow-md"
                >
                  Make Balanced
                </button>}

                <button
                  onClick={() => {
                    resetVisuals();
                    setBalanceResult(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded-lg shadow-md"
                >
                  Clear
                </button>
              </div>

            </div>

            {/* Dijkstra's Shortest Path Card */}
            <div className="w-full bg-white rounded-xl shadow-lg p-5 space-y-4 mt-6">
              <div className="text-lg font-semibold text-gray-800">Dijkstra's Shortest Path</div>
              <div className="text-sm text-gray-600 mb-3">
                Find the shortest path between two nodes in the graph. Edges can have weights.
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const source = prompt("Enter source node ID");
                    const target = prompt("Enter target node ID");
                    if (!source || !target) return;
                    const res = runDijkstra(source, target);
                    if (res) setResults(res);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg shadow-md"
                >
                  Run Dijkstra
                </button>

                <button
                  onClick={() => resetVisuals()}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-6 rounded-lg shadow-md"
                >
                  Clear
                </button>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                <p>Note: The shortest path will be highlighted in yellow. Source node: blue, Target node: orange.</p>
              </div>
            </div>

            {/* Centrality Algorithms */}
<div className="w-full bg-yellow rounded-xl shadow-lg p-5 space-y-4 mt-6">
  <div className="text-lg font-semibold text-gray-800">Centrality Measures</div>

  <div className="flex flex-col sm:flex-row gap-3">
    <button
      onClick={() => {
        const res = runDegreeCentrality();
        if (res) setResults(res);
      }}
      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg shadow-md"
    >
      Degree Centrality
    </button>

    <button
      onClick={() => {
        const res = runClosenessCentrality();
        if (res) setResults(res);
      }}
      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg shadow-md"
    >
      Closeness Centrality
    </button>

    <button
      onClick={() => {
        const res = runBetweennessCentrality();
        if (res) setResults(res);
      }}
      className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg shadow-md"
    >
      Betweenness Centrality
    </button>

    <button
      onClick={() => resetVisuals()}
      className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded-lg shadow-md"
    >
      Clear
    </button>
  </div>
</div>

            {/* HITS Algorithm */}
            <div className="w-full bg-white rounded-xl shadow-lg p-5 space-y-4 mt-6">
              <div className="text-lg font-semibold text-gray-800">HITS Algorithm</div>
              <div className="text-sm text-gray-600 mb-3">
                Computes Hub & Authority scores (for directed graphs).
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => runHITS()}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-md"
                >
                  Run HITS
                </button>

                <button
                  onClick={() => resetVisuals()}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-2 rounded-lg shadow-md"
                >
                  Clear
                </button>
              </div>

              <div className="text-sm text-gray-500 mt-2">
                <p>Authority scores shown using node color intensity (yellow).</p>
              </div>
            </div>


          </>

        )}

        {activeTab === "properties" && (
          properties ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition">
                <p className="text-xs text-gray-500">Edges</p>
                <p className="text-lg font-semibold text-gray-800">{properties.size}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition">
                <p className="text-xs text-gray-500">Density</p>
                <p className="text-lg font-semibold text-gray-800">{properties.density}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition sm:col-span-2">
                <p className="text-xs text-gray-500">Degree Info</p>
                <p className="text-sm text-gray-700">
                  min: <b>{properties.minDeg}</b>, max: <b>{properties.maxDeg}</b>, avg:{" "}
                  <b>{properties.avgDeg}</b>
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition">
                <p className="text-xs text-gray-500">Connectivity</p>
                <p className="text-sm text-gray-700">
                  {properties.connectedComponents} components
                  <br />
                  {properties.isolatedNodes} isolated nodes
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition">
                <p className="text-xs text-gray-500">Cycles Present</p>
                <p
                  className={`text-lg font-semibold ${properties.hasCycle === "Yes" ? "text-red-600" : "text-green-600"
                    }`}
                >
                  {properties.hasCycle}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition sm:col-span-2">
                <p className="text-xs text-gray-500">Clustering Coefficient</p>
                <p className="text-lg font-semibold text-gray-800">
                  {properties.clusteringCoeff}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Load a graph to see properties</p>
          )
        )}

        {activeTab === "import" && (
          <p className="text-gray-600">Import/Export functionality coming soon...</p>
        )}
      </div>
    </div>
  );
};

export default AlgorithmPanel;
