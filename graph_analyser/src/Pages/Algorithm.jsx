import React, { useState, useEffect, useRef, useCallback } from "react";
import { dijkstraSteps } from "./Algorithms/Dijkstra";
import { pageRankSteps } from "./Algorithms/PageRank";
import { hitsSteps } from "./Algorithms/Hits";
import { erModelSteps } from "./Algorithms/ermodel";
import { baModelSteps } from "./Algorithms/bamodel";
import { labelPropagationSteps } from "./Algorithms/community";
import { wsModelSteps } from "./Algorithms/wsmodel";
import { independentCascadeSteps } from "./Algorithms/ic";
import { balanceCheckSteps, balanceGreedySteps } from "./Algorithms/StructuralBalance";
import { playSteps, AnimatorController } from "./animation/Animator";

// ─── Animation speed options ──────────────────────────────────────────────────
const SPEED_OPTIONS = [
  { label: "Slow", ms: 1200 },
  { label: "Normal", ms: 600 },
  { label: "Fast", ms: 100 },
];

const AlgorithmPanel = ({ cyRef, setResults }) => {
  const [activeTab, setActiveTab] = useState("algorithms");
  const [properties, setProperties] = useState(null);
  const [selectedAlgo, setSelectedAlgo] = useState("");
  const [balanceResult, setBalanceResult] = useState(null);

  // Animation state
  const controllerRef = useRef(null);   // AnimatorController
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);   // index into SPEED_OPTIONS
  const [stepCount, setStepCount] = useState(null); // total steps (for info display)

  // ─── Graph property calculation ─────────────────────────────────────────────
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    function estimateClusteringCoefficient(cy, trials = 1000) {
      let triangles = 0, attempts = 0;
      for (let i = 0; i < trials; i++) {
        const nodes = cy.nodes();
        const v = nodes[Math.floor(Math.random() * nodes.length)];
        const neighbors = v.neighborhood("node");
        if (neighbors.length < 2) continue;
        const u = neighbors[Math.floor(Math.random() * neighbors.length)];
        let w;
        do { w = neighbors[Math.floor(Math.random() * neighbors.length)]; } while (w.id() === u.id());
        if (cy.getElementById(u.id()).edgesWith(w).length > 0) triangles++;
        attempts++;
      }
      return attempts > 0 ? triangles / attempts : 0;
    }

    function calculateProperties() {
      const nodes = cy.nodes();
      const edges = cy.edges();
      const n = nodes.length;
      const m = edges.length;
      if (n === 0) return;

      const density = cy.edges().some(e => e.data("directed"))
        ? m / (n * (n - 1))
        : (2 * m) / (n * (n - 1));
      const degrees = nodes.map(nd => nd.degree());

      const visited = new Set();
      const stack = new Set();
      let hasCycle = false;
      function dfs(node) {
        if (stack.has(node.id())) { hasCycle = true; return; }
        if (visited.has(node.id())) return;
        visited.add(node.id()); stack.add(node.id());
        node.connectedEdges().forEach(e => {
          const target = e.source().id() === node.id() ? e.target() : e.source();
          dfs(target);
        });
        stack.delete(node.id());
      }
      nodes.forEach(nd => { if (!visited.has(nd.id())) dfs(nd); });

      setProperties({
        size: m,
        density: density.toFixed(3),
        minDeg: Math.min(...degrees),
        maxDeg: Math.max(...degrees),
        avgDeg: (degrees.reduce((a, b) => a + b, 0) / n).toFixed(2),
        connectedComponents: cy.elements().components().length,
        isolatedNodes: nodes.filter(nd => nd.degree() === 0).length,
        hasCycle: hasCycle ? "Yes" : "No",
        clusteringCoeff: estimateClusteringCoefficient(cy, 1000).toFixed(3),
      });
    }

    calculateProperties();
    cy.on("add remove data", calculateProperties);
    return () => cy.removeListener("add remove data", calculateProperties);
  }, [cyRef, activeTab]);

  // ─── Visual helpers ──────────────────────────────────────────────────────────
  const resetVisuals = useCallback(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    cy.nodes().removeClass("balance-A balance-B unassigned visited final-path");
    cy.edges().removeClass("relaxed conflict flipped");
    cy.nodes().style({ "background-color": null, color: null, "border-color": null, "border-width": null, label: null, width: null, height: null });
    cy.edges().style({ "line-color": null, "target-arrow-color": null, width: null, "line-style": null, label: null });
    cy.nodes().forEach(n => n.style("label", n.data("id")));
  }, [cyRef]);

  // ─── Animation lifecycle ─────────────────────────────────────────────────────
  const stopAnimation = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.cancel();
      controllerRef.current = null;
    }
    setIsRunning(false);
    setIsPaused(false);
  }, []);

  const handlePause = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.pause();
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.resume();
    setIsPaused(false);
  }, []);

  const runAnimation = useCallback((steps, result, delay, params) => {
    stopAnimation();
    setIsRunning(true);
    setIsPaused(false);
    setStepCount(steps.length);

    const ctrl = new AnimatorController();
    controllerRef.current = ctrl;

    playSteps(cyRef.current, steps, delay, ctrl);
    ctrl.done.then(() => {
      if (!ctrl._cancelled) { setResults(result, params ?? {}); }
      setIsRunning(false);
      setIsPaused(false);
      controllerRef.current = null;
    });
  }, [cyRef, setResults, stopAnimation]);

  // ─── Main run dispatcher ─────────────────────────────────────────────────────
  const handleRun = useCallback(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const delay = SPEED_OPTIONS[speedIdx].ms;

    resetVisuals();

    if (selectedAlgo === "balance-check") {
      const { steps, result } = balanceCheckSteps(cy);
      if (!result) { alert("No graph present."); return; }
      const resultObj = {
        algorithm: "Structural Balance",
        balanced: result.balanced,
        conflicts: result.conflicts,
        conflictCount: result.conflictCount,
        graphStatus: [
          "✓ Connected graph",
          "✓ No self-loops detected",
          result.conflictCount > 0
            ? `⚠ ${result.conflictCount} conflict(s) detected`
            : "✓ No conflicts"
        ]
      };
      runAnimation(steps, resultObj, delay, {});
      return;
    }

    if (selectedAlgo === "balance-greedy") {
      const { steps, result } = balanceGreedySteps(cy, 200);
      if (!result) { alert("No graph present."); return; }
      const resultObj = {
        algorithm: "Structural Balance (Greedy)",
        balanced: result.balanced,
        conflicts: result.conflicts,
        remainingConflicts: result.remainingConflicts,
        graphStatus: [
          "✓ Greedy repair applied",
          result.remainingConflicts
            ? `⚠ ${result.remainingConflicts} conflict(s) remaining after ${result.iterations} iterations`
            : `✓ Balanced after ${result.iterations} iteration(s)`
        ]
      };
      runAnimation(steps, resultObj, Math.min(delay, 400), {});
      return;
    }

    if (selectedAlgo === "dijkstra") {
      const s = prompt("Source node ID:");
      const t = prompt("Target node ID:");
      if (!s || !t) return;
      const { steps, result } = dijkstraSteps(cy, s, t);
      runAnimation(steps, result, delay, { source: s, target: t });
      return;
    }

    if (selectedAlgo === "pagerank") {
      const dampingInput = prompt("Enter damping factor (default 0.85):") || "0.85";
      const damping = parseFloat(dampingInput) || 0.85;
      const { steps, result } = pageRankSteps(cy, damping);
      runAnimation(steps, result, delay, { damping });
      return;
    }

    if (selectedAlgo === "hits") {
      const { steps, result } = hitsSteps(cy, 25);
      runAnimation(steps, result, delay, {});
      return;
    }

    if (selectedAlgo === "degree") {
      const nodes = cy.nodes();
      const results = [];
      nodes.forEach(n => {
        const deg = n.degree();
        results.push({ node: n.id(), degree: deg });
        n.style({ "background-color": "#3b82f6", width: 30 + deg * 5, height: 30 + deg * 5, label: `${n.id()} (${deg})` });
      });
      setResults({ algorithm: "Degree Centrality", results }, {});
      return;
    }

    if (selectedAlgo === "closeness") {
      const nodes = cy.nodes();
      const closeness = {};
      nodes.forEach(src => {
        let total = 0;
        const d = cy.elements().dijkstra(src, e => parseFloat(e.data("weight") || 1));
        nodes.forEach(tgt => { if (src.id() !== tgt.id()) { const dist = d.distanceTo(tgt); if (dist !== Infinity) total += dist; } });
        closeness[src.id()] = total > 0 ? 1 / total : 0;
      });
      const maxC = Math.max(...Object.values(closeness));
      const results = [];
      nodes.forEach(n => {
        const c = closeness[n.id()];
        results.push({ node: n.id(), closeness: c.toFixed(4) });
        const size = 30 + (c / maxC) * 60;
        n.style({ "background-color": "#10b981", width: size, height: size, label: `${n.id()} (${c.toFixed(3)})` });
      });
      setResults({ algorithm: "Closeness Centrality", results }, {});
      return;
    }

    if (selectedAlgo === "betweenness") {
      const nodes = cy.nodes();
      const betweenness = {};
      nodes.forEach(n => { betweenness[n.id()] = 0; });
      nodes.forEach(s => {
        const stack = [], pred = {}, dist = {}, sigma = {};
        nodes.forEach(v => { pred[v.id()] = []; dist[v.id()] = Infinity; sigma[v.id()] = 0; });
        dist[s.id()] = 0; sigma[s.id()] = 1;
        const queue = [s];
        while (queue.length > 0) {
          const v = queue.shift(); stack.push(v);
          v.neighborhood("node").forEach(w => {
            if (dist[w.id()] === Infinity) { dist[w.id()] = dist[v.id()] + 1; queue.push(w); }
            if (dist[w.id()] === dist[v.id()] + 1) { sigma[w.id()] += sigma[v.id()]; pred[w.id()].push(v); }
          });
        }
        const delta = {};
        nodes.forEach(v => { delta[v.id()] = 0; });
        while (stack.length > 0) {
          const w = stack.pop();
          pred[w.id()].forEach(v => { delta[v.id()] += (sigma[v.id()] / sigma[w.id()]) * (1 + delta[w.id()]); });
          if (w.id() !== s.id()) betweenness[w.id()] += delta[w.id()];
        }
      });
      const maxB = Math.max(...Object.values(betweenness));
      const results = [];
      nodes.forEach(n => {
        const b = betweenness[n.id()];
        results.push({ node: n.id(), betweenness: b.toFixed(3) });
        const size = 30 + (b / maxB) * 70;
        n.style({ "background-color": "#f97316", width: size, height: size, label: `${n.id()} (${b.toFixed(3)})` });
      });
      setResults({ algorithm: "Betweenness Centrality", results }, {});
      return;
    }

    if (selectedAlgo === "er") {
      const n = parseInt(prompt("Number of nodes (e.g. 10):")) || 10;
      const p = parseFloat(prompt("Probability (0-1, e.g. 0.3):")) || 0.3;
      const response = erModelSteps(cy, n, p);
      runAnimation(response.steps, response, Math.min(delay, 300), {});
      cy.layout({ name: "cose" }).run();
      return;
    }

    if (selectedAlgo === "ba") {
      const n = parseInt(prompt("Total nodes (e.g. 15):")) || 15;
      const m = parseInt(prompt("Edges per new node (e.g. 2):")) || 2;
      const response = baModelSteps(cy, n, m);
      runAnimation(response.steps, response.result, Math.min(delay, 300), {});
      cy.layout({ name: "cose" }).run();
      return;
    }

    if (selectedAlgo === "ws") {
      const n = parseInt(prompt("Number of nodes (e.g. 20):")) || 20;
      const k = parseInt(prompt("Each node connected to k neighbors (e.g. 4):")) || 4;
      const p = parseFloat(prompt("Rewiring probability (0-1, e.g. 0.1):")) || 0.1;
      const response = wsModelSteps(cy, n, k, p);
      runAnimation(response.steps, response, Math.min(delay, 300), {});
      return;
    }

    if (selectedAlgo === "community") {
      const response = labelPropagationSteps(cy, 10);
      runAnimation(response.steps, response, delay, {});
      return;
    }

    if (selectedAlgo === "information-cascade") {
      const probability = parseFloat(prompt("Propagation probability (0-1, e.g. 0.4):")) || 0.4;
      const seedInput = prompt("Seed node IDs (comma-separated, e.g. N0,N1):") || "N0";
      const seedNodes = seedInput.split(",").map(s => s.trim());
      const response = independentCascadeSteps(cy, seedNodes, probability);
      runAnimation(response.steps, response.result, delay, {});
      return;
    }
  }, [cyRef, selectedAlgo, speedIdx, resetVisuals, runAnimation]);

  // ─── Descriptions ────────────────────────────────────────────────────────────
  const DESCRIPTIONS = {
    "balance-check": "BFS-based check — partitions nodes into groups A/B and highlights conflicting edges in red.",
    "balance-greedy": "Iteratively flips conflicting edges to reduce imbalance. Flipped edges shown in amber.",
    dijkstra: "Find the shortest path between two nodes (supports weighted edges).",
    degree: "Node size encodes its degree — larger = more connections.",
    closeness: "Nodes closer to all others are larger and greener.",
    betweenness: "Nodes on many shortest paths grow larger and turn orange.",
    pagerank: "Iterative damping — nodes accumulate rank from their incoming neighbours.",
    hits: "Authority (warm) and Hub (cool border) scores update each iteration.",
    community: "Label propagation — each node adopts the most common label among its neighbours.",
    er: "Random graph: each possible edge added with probability p.",
    ba: "Scale-free graph: new nodes prefer high-degree targets.",
    ws: "Small-world graph: ring lattice with random rewires.",
    "information-cascade": "IC model: infected nodes try to activate neighbours with given probability.",
  };

  const LABELS = {
    "balance-check": "Check Balance",
    "balance-greedy": "Make Balanced (Greedy)",
    dijkstra: "Dijkstra",
    degree: "Degree Centrality",
    closeness: "Closeness Centrality",
    betweenness: "Betweenness Centrality",
    pagerank: "PageRank",
    hits: "HITS",
    community: "Label Propagation",
    er: "Erdős–Rényi",
    ba: "Barabási–Albert",
    ws: "Watts–Strogatz",
    "information-cascade": "Information Cascade",
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">

      {/* ── Tab Header ── */}
      <div style={{ display:"flex", borderBottom:"1px solid #f3f4f6" }}>
        {["algorithms", "properties"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "capitalize",
              cursor: "pointer",
              transition: "all 0.15s",
              background: activeTab === tab ? "#fefce8" : "transparent",
              color: activeTab === tab ? "#1f2937" : "#9ca3af",
              borderBottom: activeTab === tab ? "2px solid #facc15" : "2px solid transparent",
              border: "none",
              borderBottomWidth: "2px",
              borderBottomStyle: "solid",
              borderBottomColor: activeTab === tab ? "#facc15" : "transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* ══ ALGORITHMS TAB ══ */}
        {activeTab === "algorithms" && (
          <>
            {/* Algorithm selector */}
            <div>
              <label style={{ fontSize:"11px", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em" }}>
                Select Algorithm
              </label>
              <select
                style={{
                  marginTop: "8px",
                  width: "100%",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  color: "#374151",
                  fontSize: "13px",
                  background: "#f9fafb",
                  outline: "none",
                  cursor: "pointer",
                }}
                value={selectedAlgo}
                onChange={e => { stopAnimation(); resetVisuals(); setSelectedAlgo(e.target.value); }}
              >
                <option value="">— Choose an Algorithm —</option>
                <optgroup label=" Structural Balance">
                  <option value="balance-check">Check Balance</option>
                  <option value="balance-greedy">Make Balanced (Greedy)</option>
                </optgroup>
                <optgroup label=" Shortest Path">
                  <option value="dijkstra">Dijkstra</option>
                </optgroup>
                <optgroup label=" Centrality">
                  <option value="degree">Degree Centrality</option>
                  <option value="closeness">Closeness Centrality</option>
                  <option value="betweenness">Betweenness Centrality</option>
                </optgroup>
                <optgroup label=" Ranking">
                  <option value="pagerank">PageRank</option>
                  <option value="hits">HITS</option>
                </optgroup>
                <optgroup label=" Graph Generators">
                  <option value="er">Erdős–Rényi (ER)</option>
                  <option value="ba">Barabási–Albert (BA)</option>
                  <option value="ws">Watts–Strogatz (WS)</option>
                </optgroup>
                <optgroup label="  Community">
                  <option value="community">Label Propagation</option>
                </optgroup>
                <optgroup label="  Diffusion">
                  <option value="information-cascade">Information Cascade</option>
                </optgroup>
              </select>
            </div>

            {/* Algorithm card */}
            {selectedAlgo && (
              <div style={{ borderRadius:"16px", border:"1px solid #f3f4f6", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>

                {/* Card header – gold gradient */}
                <div style={{ background:"linear-gradient(135deg,#f59e0b,#fbbf24)", padding:"12px 16px" }}>
                  <p style={{ fontSize:"10px", fontWeight:700, color:"#78350f", textTransform:"uppercase", letterSpacing:"0.1em", opacity:0.8, margin:0 }}>
                    Algorithm
                  </p>
                  <h2 style={{ fontSize:"15px", fontWeight:700, color:"#fff", margin:"2px 0 0", lineHeight:1.3 }}>
                    {LABELS[selectedAlgo] ?? selectedAlgo}
                  </h2>
                </div>

                <div style={{ padding:"16px", display:"flex", flexDirection:"column", gap:"14px" }}>

                  {/* Description */}
                  <p style={{ fontSize:"12px", color:"#6b7280", lineHeight:1.6, margin:0 }}>
                    {DESCRIPTIONS[selectedAlgo]}
                  </p>

                  {/* Speed selector */}
                  <div>
                    <p style={{ fontSize:"10px", fontWeight:700, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"8px" }}>
                      Animation Speed
                    </p>
                    <div style={{ display:"flex", gap:"6px" }}>
                      {SPEED_OPTIONS.map((opt, idx) => (
                        <button
                          key={opt.label}
                          onClick={() => setSpeedIdx(idx)}
                          disabled={isRunning}
                          style={{
                            flex: 1,
                            padding: "7px 0",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: isRunning ? "not-allowed" : "pointer",
                            opacity: isRunning ? 0.5 : 1,
                            border: "none",
                            transition: "all 0.15s",
                            background: speedIdx === idx ? "#facc15" : "#f3f4f6",
                            color: speedIdx === idx ? "#fff" : "#6b7280",
                            boxShadow: speedIdx === idx ? "0 1px 4px rgba(250,204,21,0.4)" : "none",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  

                  {/* ── Control Buttons ── */}
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>

                    {/* Primary row */}
                    <div style={{ display:"flex", gap:"8px" }}>

                      {/* RUN — only when not running */}
                      {!isRunning && (
                        <button
                          onClick={handleRun}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "11px 0",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            border: "none",
                            background: "#facc15",
                            color: "#fff",
                            boxShadow: "0 2px 8px rgba(250,204,21,0.45)",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background="#f59e0b"}
                          onMouseLeave={e => e.currentTarget.style.background="#facc15"}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
                          </svg>
                          Run
                        </button>
                      )}

                      {/* PAUSE — running and not paused */}
                      {isRunning && !isPaused && (
                        <button
                          onClick={handlePause}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "11px 0",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            border: "none",
                            background: "#6366f1",
                            color: "#fff",
                            boxShadow: "0 2px 8px rgba(99,102,241,0.4)",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background="#4f46e5"}
                          onMouseLeave={e => e.currentTarget.style.background="#6366f1"}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zm7 0a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd"/>
                          </svg>
                          Pause
                        </button>
                      )}

                      {/* RESUME — running and paused */}
                      {isRunning && isPaused && (
                        <button
                          onClick={handleResume}
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "11px 0",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            border: "none",
                            background: "#22c55e",
                            color: "#fff",
                            boxShadow: "0 2px 8px rgba(34,197,94,0.4)",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background="#16a34a"}
                          onMouseLeave={e => e.currentTarget.style.background="#22c55e"}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z"/>
                          </svg>
                          Resume
                        </button>
                      )}

                      {/* STOP — always visible while running */}
                      {isRunning && (
                        <button
                          onClick={stopAnimation}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "11px 16px",
                            borderRadius: "12px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            border: "none",
                            background: "#ef4444",
                            color: "#fff",
                            boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background="#dc2626"}
                          onMouseLeave={e => e.currentTarget.style.background="#ef4444"}
                        >
                          <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 5h10v10H5V5z" clipRule="evenodd"/>
                          </svg>
                          Stop
                        </button>
                      )}
                    </div>

                    {/* Secondary row — Reset (only when not running) */}
                    {!isRunning && (
                      <button
                        onClick={resetVisuals}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px 0",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                          color: "#6b7280",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background="#f3f4f6"; e.currentTarget.style.color="#374151"; }}
                        onMouseLeave={e => { e.currentTarget.style.background="#f9fafb"; e.currentTarget.style.color="#6b7280"; }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Reset 
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}
          </>
        )}

        {/* ══ PROPERTIES TAB ══ */}
        {activeTab === "properties" && (
          properties ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              {[
                { label: "Edges",        value: properties.size,               wide: false },
                { label: "Density",      value: properties.density,            wide: false },
                { label: "Avg Degree",   value: properties.avgDeg,             wide: false },
                { label: "Degree Range", value: `${properties.minDeg} – ${properties.maxDeg}`, wide: false },
                { label: "Components",   value: properties.connectedComponents, wide: false },
                { label: "Isolated",     value: properties.isolatedNodes,       wide: false },
                { label: "Clustering",   value: properties.clusteringCoeff,     wide: true  },
                { label: "Has Cycles",   value: properties.hasCycle,            wide: false, colored: true },
              ].map(item => (
                <div
                  key={item.label}
                  style={{
                    padding: "10px 12px",
                    background: "#f9fafb",
                    borderRadius: "10px",
                    border: "1px solid #f3f4f6",
                    gridColumn: item.wide ? "span 2" : "span 1",
                  }}
                >
                  <p style={{ fontSize:"11px", color:"#9ca3af", fontWeight:500, margin:0 }}>{item.label}</p>
                  <p style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    margin: "2px 0 0",
                    color: item.colored
                      ? (properties.hasCycle === "Yes" ? "#ef4444" : "#22c55e")
                      : "#1f2937",
                  }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 0", color:"#9ca3af" }}>
              <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity:0.3, marginBottom:"8px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              <p style={{ fontSize:"13px", margin:0 }}>Load a graph to see properties</p>
            </div>
          )
        )}

      </div>

      {/* Pulse animation for the status dot */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default AlgorithmPanel;
