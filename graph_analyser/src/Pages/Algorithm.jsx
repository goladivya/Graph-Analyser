import React, { useState, useEffect } from "react";
import { dijkstraSteps } from "./Algorithms/Dijkstra";
import { pageRankSteps } from "./Algorithms/PageRank";
import { hitsSteps } from "./Algorithms/Hits";
import { erModelSteps } from "./Algorithms/ermodel";
import { baModelSteps } from "./Algorithms/bamodel";
import { labelPropagationSteps } from "./Algorithms/community";
import { wsModelSteps } from "./Algorithms/wsmodel";
import { independentCascadeSteps } from "./Algorithms/ic";
import { playSteps } from "./animation/Animator";

const AlgorithmPanel = ({ cyRef, setResults }) => {
  const [activeTab, setActiveTab] = useState("algorithms");
  const [properties, setProperties] = useState(null);
  const [balanceResult, setBalanceResult] = useState(null);
  const [selectedAlgo, setSelectedAlgo] = useState("");





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
    try { cy.style().update(); } catch (e) { }
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

      </div>

      <div className="p-4 space-y-2">
        {activeTab === "algorithms" && (
          <>
            {/* Algorithm Dropdown */}
            <div className="bg-white rounded-xl shadow p-5 mb-4">
              <label className="text-sm text-gray-600">Select Algorithm</label>

              <select
                className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-yellow-400"
                value={selectedAlgo}
                onChange={(e) => setSelectedAlgo(e.target.value)}
              >
                <option value="">-- Choose an Algorithm --</option>

                <optgroup label="Structural Balance">
                  <option value="balance-check">Check Balance</option>
                  <option value="balance-greedy">Make Balanced (Greedy)</option>
                </optgroup>

                <optgroup label="Shortest Path">
                  <option value="dijkstra">Dijkstra</option>
                </optgroup>

                <optgroup label="Centrality Measures">
                  <option value="degree">Degree Centrality</option>
                  <option value="closeness">Closeness Centrality</option>
                  <option value="betweenness">Betweenness Centrality</option>
                </optgroup>

                <optgroup label="Ranking">
                  <option value="pagerank">PageRank</option>
                  <option value="hits">HITS</option>
                </optgroup>

                <optgroup label="Graph Generators">
                  <option value="er">Erdos-Renyi (ER)</option>
                  <option value="ba">Barabasi-Albert (BA)</option>
                  <option value="ws">Watts-Strogatz (WS)</option>
                </optgroup>

                <optgroup label="Community Detection">
                  <option value="community">Label Propagation</option>
                </optgroup>

                <optgroup label="Diffusion Models">
                  <option value="information-cascade">
                    Information Cascade
                  </option>
                </optgroup>

              </select>
            </div>

            {/* Dynamic Algorithm Card */}
            {selectedAlgo && (
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-800 text-center">
                  {selectedAlgo.replace("-", " ").toUpperCase()}
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-600">
                  {selectedAlgo === "balance-check" && "Check whether the signed graph is structurally balanced."}
                  {selectedAlgo === "balance-greedy" && "Automatically flip edges to reduce conflicts and balance the graph."}
                  {selectedAlgo === "dijkstra" && "Find the shortest path between two nodes (supports weighted edges)."}
                  {selectedAlgo === "degree" && "Compute degree centrality for each node."}
                  {selectedAlgo === "closeness" && "Measure closeness centrality of all nodes based on shortest paths."}
                  {selectedAlgo === "betweenness" && "Compute betweenness centrality using Brandes’ algorithm."}
                  {selectedAlgo === "pagerank" && "Compute PageRank values using iterative damping algorithm."}
                  {selectedAlgo === "community" && "Detect communities using label propagation."}
                  {selectedAlgo === "er" && "Generate a random graph using the Erdos-Renyi model."}
                  {selectedAlgo === "ba" && "Generate a scale-free graph using the Barabasi-Albert model."}
                  {selectedAlgo === "ws" && "Generate a small-world graph using the Watts-Strogatz model."}
                  {selectedAlgo === "information-cascade" && "Simulate an information cascade using the Independent Cascade model."}
                </p>

                {/* BUTTON GROUP */}
                <div className="flex gap-4 mt-4 justify-center">

                  {/* Run Algorithm Button */}
                  <button
                    onClick={async () => {
                      if (selectedAlgo === "balance-check") handleRunBalance();
                      if (selectedAlgo === "balance-greedy") handleMakeBalanced();
                      if (selectedAlgo === "dijkstra") {
                        const s = prompt("Source");
                        const t = prompt("Target");
                        const steps = dijkstraSteps(cyRef.current, s, t);
                        playSteps(cyRef.current, steps, 700);
                        setResults(steps.result);
                      }
                      if (selectedAlgo === "degree") setResults(runDegreeCentrality());
                      if (selectedAlgo === "closeness") setResults(runClosenessCentrality());
                      if (selectedAlgo === "betweenness") setResults(runBetweennessCentrality());
                      if (selectedAlgo === "pagerank") {
                        const d = prompt("Enter damping factor (default 0.85):") || 0.85;
                        const response = pageRankSteps(cyRef.current);
                        playSteps(cyRef.current, response.steps, 700);
                        setResults(response.result);
                      }
                      if (selectedAlgo === "hits") {
                        const response = hitsSteps(cyRef.current, 25)
                        playSteps(cyRef.current, response.steps, 700);
                        setResults(response.result);
                      }
                      if (selectedAlgo === "er") {
                        const n = parseInt(prompt("Number of nodes (e.g. 10):")) || 10;
                        const p = parseFloat(prompt("Probability (0-1, e.g. 0.3):")) || 0.3;

                        const response = erModelSteps(cyRef.current, n, p);
                        await playSteps(cyRef.current, response.steps, 300);

                        cyRef.current.layout({ name: "cose" }).run();  // auto arrange
                        setResults(response);
                        return;
                      }
                      if (selectedAlgo === "ba") {

                        const n = parseInt(prompt("Total nodes (e.g. 15):")) || 15;
                        const m = parseInt(prompt("Edges per new node (e.g. 2):")) || 2;

                        const response = baModelSteps(cyRef.current, n, m);

                        await playSteps(cyRef.current, response.steps, 300);
                         cyRef.current.layout({ name: "cose" }).run(); 

                        setResults(response.result);
                        return;
                      }

                      if (selectedAlgo === "community") {
                        const response = labelPropagationSteps(cyRef.current, 10);
                        await playSteps(cyRef.current, response.steps, 500);
                        setResults(response);
                      }

                      if (selectedAlgo === "ws") {
                        const n = parseInt(prompt("Number of nodes (e.g. 20):")) || 20;
                        const k = parseInt(prompt("Each node connected to k neighbors (e.g. 4):")) || 4;
                        const p = parseFloat(prompt("Rewiring probability (0-1, e.g. 0.1):")) || 0.1;
                        const response = wsModelSteps(cyRef.current, n, k, p);
                        await playSteps(cyRef.current, response.steps, 300);

                        //cyRef.current.layout({ name: "cose" }).run();
                        setResults(response);
                        return;
                      }

                      if (selectedAlgo === "information-cascade") {

                        const probability =
                          parseFloat(prompt("Propagation probability (0-1, e.g. 0.4):")) || 0.4;

                        const seedInput =
                          prompt("Enter seed node IDs separated by comma (e.g. N0,N1):") || "N0";

                        const seedNodes = seedInput.split(",").map(s => s.trim());

                        const response = independentCascadeSteps(
                          cyRef.current,
                          seedNodes,
                          probability
                        );

                        await playSteps(cyRef.current, response.steps, 700);

                        setResults(response.result);
                        return;
                      }

                    }}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-md"
                  >
                    Run
                  </button>

                  {/* Clear Button */}
                  <button
                    onClick={() => resetVisuals()}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-md"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
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


      </div>
    </div>
  );
};

export default AlgorithmPanel;