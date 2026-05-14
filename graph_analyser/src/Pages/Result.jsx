import React, { useState } from "react";

// ─── Shared primitives ────────────────────────────────────────────────────────

function ScoreBar({ value, max, color = "#6366f1" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-0.5 overflow-hidden">
      <div
        style={{ width: `${pct}%`, background: color, transition: "width .35s ease" }}
        className="h-2 rounded-full"
      />
    </div>
  );
}

function StatCard({ label, value, sub, accent = "#6366f1", wide = false }) {
  return (
    <div
      className={`rounded-xl border p-3 flex flex-col gap-0.5 ${wide ? "col-span-2" : ""}`}
      style={{ borderColor: accent + "33", background: accent + "08" }}
    >
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function Collapsible({ title, icon, children, defaultOpen = false, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-amber-50 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {icon && <span className="text-base">{icon}</span>}
          {title}
          {badge !== undefined && (
            <span className="ml-1 text-xs font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 py-3 space-y-2 bg-white">{children}</div>}
    </div>
  );
}

function RankedList({ entries, maxVal, color, limit = 20 }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? entries : entries.slice(0, limit);
  return (
    <div className="space-y-2">
      {shown.map(([node, val], i) => (
        <div key={node}>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-mono font-semibold text-gray-700">
              {i === 0 && <span className="text-amber-500">★</span>}
              {node}
            </span>
            <span className="text-gray-500 tabular-nums">
              {typeof val === "number" ? val.toFixed(4) : val}
            </span>
          </div>
          <ScoreBar value={val} max={maxVal} color={i === 0 ? "#f59e0b" : color} />
        </div>
      ))}
      {entries.length > limit && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-xs text-indigo-500 hover:underline mt-1"
        >
          {expanded ? "▲ Show less" : `▼ Show ${entries.length - limit} more`}
        </button>
      )}
    </div>
  );
}

// ─── Algorithm Panels ─────────────────────────────────────────────────────────

function BalancePanel({ r }) {
  const ok = r.balanced;
  const conflictCount = r.conflictCount ?? r.conflicts?.length ?? 0;
  const partitionEntries = r.partition ? Object.entries(r.partition) : [];
  const groupA = partitionEntries.filter(([, v]) => v === 0).map(([k]) => k);
  const groupB = partitionEntries.filter(([, v]) => v === 1).map(([k]) => k);

  return (
    <>
      {/* Verdict banner */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${ok ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
        <span className="text-2xl">{ok ? "✅" : "❌"}</span>
        <div>
          <p className="font-bold text-sm text-gray-800">
            {ok ? "Graph is Structurally Balanced" : "Graph is NOT Balanced"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {ok
              ? "All triangles satisfy the balance theorem. Nodes cleanly split into two friendly factions."
              : `${conflictCount} edge(s) violate the balance theorem (highlighted red on graph).`}
          </p>
          {r.iterations !== undefined && (
            <p className="text-xs text-gray-400 mt-1">Greedy repair iterations: {r.iterations}</p>
          )}
        </div>
      </div>

      {/* Stats row */}
      

      {/* Node partitions */}
      {partitionEntries.length > 0 && (
        <Collapsible title="Node Partitions" icon="🔵🟠" defaultOpen>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Group A", nodes: groupA, bg: "#3b82f6", light: "#eff6ff", border: "#bfdbfe" },
              { label: "Group B", nodes: groupB, bg: "#f97316", light: "#fff7ed", border: "#fed7aa" },
            ].map(({ label, nodes, bg, light, border }) => (
              <div key={label} className="rounded-lg p-2 border" style={{ background: light, borderColor: border }}>
                <p className="text-xs font-bold mb-1.5" style={{ color: bg }}>
                  {label} · {nodes.length} nodes
                </p>
                <div className="flex flex-wrap gap-1">
                  {nodes.map(n => (
                    <span key={n} className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold"
                      style={{ background: bg + "22", color: bg, border: `1px solid ${bg}44` }}>
                      {n}
                    </span>
                  ))}
                  {nodes.length === 0 && <span className="text-xs text-gray-400 italic">none</span>}
                </div>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Conflict edges */}
      {r.conflicts?.length > 0 && (
        <Collapsible title="Conflicting Edges" icon="⚡" badge={r.conflicts.length}>
          <p className="text-xs text-gray-400 mb-2">
            These edges are shown in red on the graph and violate the balance theorem.
          </p>
          <div className="flex flex-wrap gap-1">
            {r.conflicts.map(eid => (
              <span key={eid} className="text-xs px-2 py-0.5 rounded-full font-mono border"
                style={{ background: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" }}>
                {eid}
              </span>
            ))}
          </div>
        </Collapsible>
      )}
    </>
  );
}

function PageRankPanel({ r }) {
  const entries = Object.entries(r.ranks ?? {});
  const maxVal  = entries[0]?.[1] ?? 1;

  return (
    <>
      {/* Top node spotlight */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
       
        <div>
          <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Highest PageRank</p>
          <p className="font-bold text-gray-800 text-xl font-mono">{r.topNode}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Score: <span className="font-semibold text-amber-700">{r.topScore}</span>
            &nbsp;·&nbsp;Damping: {r.damping}&nbsp;·&nbsp;{r.iterations} iterations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Nodes ranked" value={entries.length} accent="#6366f1" />
        <StatCard label="Damping" value={r.damping} accent="#3b82f6" />
        <StatCard label="Iterations" value={r.iterations} accent="#10b981" />
      </div>

      {/* Ranked list */}
      <Collapsible title="All Nodes — Ranked by PageRank" icon="📊" defaultOpen badge={entries.length}>
        <RankedList entries={entries} maxVal={maxVal} color="#6366f1" />
      </Collapsible>
    </>
  );
}

function HitsPanel({ r }) {
  const authEntries = Object.entries(r.authorities ?? {});
  const hubEntries  = Object.entries(r.hubs ?? {});
  const maxA = authEntries[0]?.[1] ?? 1;
  const maxH = hubEntries[0]?.[1]  ?? 1;

  return (
    <>
      {/* Champion cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center p-3 rounded-xl bg-amber-50 border border-amber-200">
          
          <p className="text-xs font-bold text-amber-700 mt-1">Top Authority</p>
          <p className="font-mono font-bold text-gray-800 text-lg">{r.topAuthority}</p>
          <p className="text-xs text-gray-500">{r.authorities?.[r.topAuthority]?.toFixed(6)}</p>
          <p className="text-xs text-gray-400 mt-0.5 text-center">Most linked-to node</p>
        </div>
        <div className="flex flex-col items-center p-3 rounded-xl bg-indigo-50 border border-indigo-200">
          <span className="text-2xl">🔗</span>
          <p className="text-xs font-bold text-indigo-700 mt-1">Top Hub</p>
          <p className="font-mono font-bold text-gray-800 text-lg">{r.topHub}</p>
          <p className="text-xs text-gray-500">{r.hubs?.[r.topHub]?.toFixed(6)}</p>
          <p className="text-xs text-gray-400 mt-0.5 text-center">Best pointer to authorities</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Nodes" value={authEntries.length} accent="#6366f1" />
        <StatCard label="Iterations" value={r.iterations} accent="#10b981" />
      </div>

      <p className="text-xs text-center text-gray-400">
        Authority = quality of content · Hub = quality of outgoing links
      </p>

      <Collapsible title="Authority Scores"  defaultOpen badge={authEntries.length}>
        <RankedList entries={authEntries} maxVal={maxA} color="#f59e0b" />
      </Collapsible>

      <Collapsible title="Hub Scores"  badge={hubEntries.length}>
        <RankedList entries={hubEntries} maxVal={maxH} color="#6366f1" />
      </Collapsible>
    </>
  );
}

function DijkstraPanel({ r }) {
  const path = r.path ?? [];
  const distEntries = r.distances
    ? Object.entries(r.distances).filter(([, v]) => v !== "∞")
    : [];

  return (
    <>
      {path.length > 0 ? (
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Shortest Path</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {path.map((node, i) => (
              <React.Fragment key={i}>
                <span className="font-mono text-sm font-bold px-2.5 py-1 bg-white border border-green-300 rounded-lg text-green-800 shadow-sm">
                  {node}
                </span>
                {i < path.length - 1 && <span className="text-green-500 font-bold text-base">→</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <p className="text-xs text-gray-500">
              Total cost: <span className="font-bold text-green-700 text-sm">{r.cost}</span>
            </p>
            <p className="text-xs text-gray-500">
              Hops: <span className="font-bold text-green-700 text-sm">{path.length - 1}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200">
          <p className="text-sm font-semibold text-red-700">No path found</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {r.source} → {r.target} are not connected in this graph.
          </p>
        </div>
      )}

      {distEntries.length > 0 && (
        <Collapsible title={`All Distances from "${r.source}"`}  badge={distEntries.length}>
          <div className="space-y-1.5">
            {distEntries
              .sort((a, b) => Number(a[1]) - Number(b[1]))
              .map(([node, dist]) => (
                <div key={node} className="flex justify-between items-center text-xs text-gray-600">
                  <span className="font-mono font-semibold">{node}</span>
                  <span className="tabular-nums font-medium bg-gray-100 px-2 py-0.5 rounded">{dist}</span>
                </div>
              ))}
          </div>
        </Collapsible>
      )}
    </>
  );
}

function CentralityPanel({ r }) {
  if (!r.results) return null;
  const valueKey = Object.keys(r.results[0] ?? {}).find(k => k !== "node");
  if (!valueKey) return null;

  const sorted = [...r.results].sort(
    (a, b) => parseFloat(b[valueKey]) - parseFloat(a[valueKey])
  );
  const entries = sorted.map(row => [row.node, parseFloat(row[valueKey])]);
  const maxVal  = entries[0]?.[1] ?? 1;
  const topNode = entries[0]?.[0];

  const config = {
    "Degree Centrality":      { color: "#3b82f6",  desc: "Counts direct connections. Larger node = more connections.", unit: "degree" },
    "Closeness Centrality":   { color: "#10b981",  desc: "Inverse sum of shortest paths. Nodes closer to all others rank highest.", unit: "score" },
    "Betweenness Centrality": { color: "#f97316",  desc: "Fraction of shortest paths passing through each node.", unit: "score" },
  };
  const { color, icon, desc, unit } = config[r.algorithm] ?? { color: "#6366f1",  desc: "", unit: "score" };

  return (
    <>
      {/* Top node */}
      <div className="flex items-center gap-3 p-3 rounded-xl border"
        style={{ background: color + "10", borderColor: color + "40" }}>
        <span className="text-3xl">{icon}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>Most Central Node</p>
          <p className="font-mono font-bold text-gray-800 text-lg">{topNode}</p>
          <p className="text-xs text-gray-500">{unit}: <span className="font-semibold" style={{ color }}>{maxVal.toFixed(4)}</span></p>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 leading-relaxed">{desc}</p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Nodes analysed" value={entries.length} accent={color} />
        <StatCard label="Top score" value={maxVal.toFixed(4)} accent={color} />
      </div>

      {/* Ranked list */}
      <Collapsible title={`${r.algorithm} — All Nodes`}  defaultOpen badge={entries.length}>
        <RankedList entries={entries} maxVal={maxVal} color={color} />
      </Collapsible>
    </>
  );
}

function CommunityPanel({ r }) {
  const data = r.result ?? r;
  const total = data.totalCommunities ?? "?";
  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50 border border-purple-200">
       
        <div>
          <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Communities Found</p>
          <p className="font-bold text-gray-800 text-3xl">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Label Propagation algorithm</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 leading-relaxed">
        Nodes sharing the same fill colour belong to the same community.
        Each node adopts the most common label among its neighbours over 10 iterations.
        Re-run to see a different partition (algorithm is randomised).
      </p>
    </>
  );
}

// ── Shared mini components for graph gen panels ───────────────────────────────

function MetricRow({ label, value, sub, highlight }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${highlight ? "bg-amber-50 border border-amber-100" : "bg-gray-50"}`}>
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${highlight ? "text-amber-700" : "text-gray-800"}`}>
        {value}{sub && <span className="text-xs font-normal text-gray-400 ml-1">{sub}</span>}
      </span>
    </div>
  );
}

function SectionHeader({ title, color }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color }}>
      {title}
    </p>
  );
}

// ── Erdős–Rényi Panel ──────────────────────────────────────────────────────────
function ERPanel({ r }) {
  const pct = v => (v * 100).toFixed(1) + "%";
  const aboveThreshold = r.aboveConnectivityThreshold;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
       
        <div>
          <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Erdős–Rényi Random Graph</p>
          <p className="font-bold text-gray-800 text-lg">G({r.nodes}, {r.probability})</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {r.actualEdges} edges generated &nbsp;·&nbsp; Expected {r.expectedEdges}
          </p>
        </div>
      </div>

      {/* Phase transition alert */}
      <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${aboveThreshold ? "bg-green-50 border-green-200 text-green-800" : "bg-orange-50 border-orange-200 text-orange-800"}`}>
        <span className="text-base mt-0.5">{aboveThreshold ? "✅" : "⚠️"}</span>
        <div>
          <p className="font-semibold">
            {aboveThreshold ? "Above connectivity threshold" : "Below connectivity threshold"}
          </p>
          <p className="mt-0.5 text-gray-600">
            Critical p = {r.criticalProbability} &nbsp;(= 1/(n−1)).&nbsp;
            {aboveThreshold
              ? "Graph likely has a giant connected component."
              : "Graph likely fragmented into multiple components."}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Nodes" value={r.nodes} accent="#3b82f6" />
        <StatCard label="Actual edges" value={r.actualEdges} sub={`/ ${r.maxPossibleEdges} max`} accent="#6366f1" />
        <StatCard label="Density" value={pct(r.actualDensity)} sub={`≈ p=${r.probability}`} accent="#3b82f6" />
        <StatCard label="Components" value={r.connectedComponents} accent={r.isConnected ? "#22c55e" : "#ef4444"} />
      </div>

      {/* Degree stats */}
      <Collapsible title="Degree Statistics"  defaultOpen>
        <div className="space-y-1.5">
          <MetricRow label="Average degree" value={r.avgDegree} sub={`(expected ${r.expectedAvgDegree})`} highlight />
          <MetricRow label="Max degree" value={r.maxDegree} />
          <MetricRow label="Min degree" value={r.minDegree} />
          <MetricRow label="Isolated nodes (degree 0)" value={r.isolatedNodes} />
        </div>
        <div className="mt-3 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700">
          In G(n, p), each node has expected degree <strong>(n−1)·p = {r.expectedAvgDegree}</strong>.
          Actual avg: <strong>{r.avgDegree}</strong>. Deviation is normal randomness.
        </div>
      </Collapsible>

      {/* Clustering */}
      <Collapsible title="Clustering & Structure" >
        <div className="space-y-1.5">
          <MetricRow label="Clustering coefficient" value={r.clusteringCoefficient} sub={`(theory ≈ p = ${r.theoreticalClustering})`} highlight />
        </div>
        <div className="mt-3 p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600">
          In ER graphs the clustering coefficient ≈ p because edge placements are independent.
          Higher actual values can occur in small graphs by chance.
        </div>
      </Collapsible>

      {/* Degree distribution */}
      {r.topDegrees?.length > 0 && (
        <Collapsible title="Degree Distribution (top degrees)" >
          <div className="space-y-1.5">
            {r.topDegrees.map(({ degree, count }) => (
              <div key={degree}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-500">Degree {degree}</span>
                  <span className="font-semibold text-gray-700">{count} node{count > 1 ? "s" : ""}</span>
                </div>
                <ScoreBar value={count} max={r.nodes} color="#3b82f6" />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            ER degree distribution follows a Poisson / Binomial distribution — most nodes cluster around the mean.
          </p>
        </Collapsible>
      )}
    </>
  );
}

// ── Barabási–Albert Panel ─────────────────────────────────────────────────────
function BAPanel({ r }) {
  const pct = v => (v * 100).toFixed(1) + "%";

  // Gamma quality colour
  const g = r.gammaEstimate;
  const gammaColor = g == null ? "#9ca3af"
    : g >= 2.5 && g <= 3.5 ? "#22c55e"
    : g >= 2.0 && g <= 4.0 ? "#f59e0b"
    : "#ef4444";

  return (
    <>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px",
                    background:"#f5f3ff", borderRadius:"14px", border:"1px solid #ede9fe" }}>
        <span style={{ fontSize:"2.2rem" }}>🌐</span>
        <div>
          <p style={{ fontSize:"10px", fontWeight:700, color:"#7c3aed",
                      textTransform:"uppercase", letterSpacing:"0.09em", margin:0 }}>
            Barabási–Albert Scale-Free Graph
          </p>
          <p style={{ fontSize:"15px", fontWeight:700, color:"#1f2937", margin:"2px 0 0" }}>
            BA(n={r.totalNodes}, m={r.edgesPerNode}, m₀={r.seedNodes})
          </p>
          <p style={{ fontSize:"11px", color:"#6b7280", margin:"2px 0 0" }}>
            {r.totalEdges} edges · avg degree {r.avgDegree} (theory 2m = {r.theoreticalAvgDeg})
          </p>
        </div>
      </div>

      {/* Power-law quality banner */}
      <div style={{
        display:"flex", alignItems:"flex-start", gap:"10px",
        padding:"12px 14px", borderRadius:"12px", border:"1px solid #e9d5ff",
        background: g >= 2.5 && g <= 3.5 ? "#f0fdf4" : g >= 2.0 ? "#fffbeb" : "#fef2f2",
      }}>
       
        <div>
          <p style={{ fontWeight:700, fontSize:"13px", color:"#1f2937", margin:0 }}>
            Power-Law Exponent γ ={" "}
            <span style={{ color: gammaColor }}>{g != null ? g.toFixed(3) : "N/A"}</span>
            <span style={{ fontSize:"11px", fontWeight:400, color:"#9ca3af", marginLeft:"8px" }}>
              (theory: γ = 3)
            </span>
          </p>
          <p style={{ fontSize:"11px", color:"#6b7280", margin:"4px 0 0", lineHeight:1.5 }}>
            {r.scaleFreeQuality} fit · R² = {r.powerLawR2 ?? "N/A"}.&nbsp;
            The BA model theoretically produces P(k) ∝ k<sup>−3</sup>.
            Small graphs (n &lt; 100) show γ &gt; 3 due to finite-size effects.
          </p>
        </div>
      </div>

      {/* Stat grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
        {[
          { label:"Total nodes", value: r.totalNodes },
          { label:"Seed nodes (m₀)", value: r.seedNodes },
          { label:"m (edges/node)", value: r.edgesPerNode },
          { label:"Total edges", value: `${r.totalEdges}  (≈${r.theoreticalEdges})` },
          { label:"Avg degree", value: `${r.avgDegree}  (2m=${r.theoreticalAvgDeg})` },
          { label:"Max degree", value: r.maxDegree },
          { label:"Density", value: pct(r.density) },
          { label:"Heterogeneity k_max/⟨k⟩", value: r.degreeHeterogeneity + "×" },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding:"10px 12px", background:"#f9fafb",
                                     borderRadius:"10px", border:"1px solid #f3f4f6" }}>
            <p style={{ fontSize:"10px", color:"#9ca3af", fontWeight:600,
                        textTransform:"uppercase", letterSpacing:"0.06em", margin:0 }}>{label}</p>
            <p style={{ fontSize:"13px", fontWeight:700, color:"#1f2937", margin:"3px 0 0" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Top hubs */}
      {r.topHubs?.length > 0 && (
        <Collapsible title={`Top Hubs  (degree ≥ ${r.hubThreshold})`} icon="🏆" defaultOpen badge={r.hubCount}>
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {r.topHubs.map(({ node, degree }, i) => (
              <div key={node}>
                <div style={{ display:"flex", justifyContent:"space-between",
                               alignItems:"center", marginBottom:"3px" }}>
                  <span style={{ fontSize:"12px", fontFamily:"monospace", fontWeight:700,
                                  color:"#374151", display:"flex", alignItems:"center", gap:"6px" }}>
                    {i === 0 && <span style={{ color:"#f59e0b" }}>★</span>}
                    {node}
                  </span>
                  <span style={{ fontSize:"11px", color:"#6b7280" }}>degree {degree}</span>
                </div>
                <ScoreBar value={degree} max={r.maxDegree} color={i === 0 ? "#f59e0b" : "#8b5cf6"} />
              </div>
            ))}
          </div>
          <p style={{ fontSize:"11px", color:"#9ca3af", marginTop:"10px", lineHeight:1.5 }}>
            Hubs emerge via "rich-get-richer": P(attach to node i) = k_i / Σk_j.
            Early nodes accumulate disproportionately many edges.
          </p>
        </Collapsible>
      )}

      {/* Degree distribution */}
      {r.degreeDistribution?.length > 0 && (
        <Collapsible title="Degree Distribution" icon="📊">
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {r.degreeDistribution.map(({ degree, count, fraction }) => (
              <div key={degree}>
                <div style={{ display:"flex", justifyContent:"space-between",
                               fontSize:"11px", marginBottom:"2px" }}>
                  <span style={{ color:"#6b7280" }}>k = {degree}</span>
                  <span style={{ fontWeight:600, color:"#374151" }}>
                    {count} node{count > 1 ? "s" : ""}&nbsp;
                    <span style={{ color:"#9ca3af", fontWeight:400 }}>({(fraction * 100).toFixed(1)}%)</span>
                  </span>
                </div>
                <ScoreBar value={count} max={r.totalNodes} color="#8b5cf6" />
              </div>
            ))}
          </div>
          <div style={{ marginTop:"10px", padding:"10px", background:"#f5f3ff",
                         borderRadius:"10px", fontSize:"11px", color:"#5b21b6", lineHeight:1.6 }}>
            <strong>Power-law P(k) ∝ k⁻³</strong> — many low-degree nodes, exponentially fewer
            high-degree hubs. The distribution is heavy-tailed: no characteristic scale.
          </div>
        </Collapsible>
      )}

      {/* Theory box */}
      <div style={{ padding:"12px 14px", background:"#fafafa", borderRadius:"12px",
                     border:"1px solid #e5e7eb", fontSize:"11px", color:"#6b7280", lineHeight:1.7 }}>
        <p style={{ fontWeight:700, color:"#374151", margin:"0 0 4px" }}>
          Theoretical Properties (n → ∞)
        </p>
        <p style={{ margin:0 }}>
          • Average degree  ⟨k⟩ = 2m = {r.theoreticalAvgDeg}<br/>
          • Degree exponent  γ = 3  (independent of m)<br/>
          • Max hub degree  k_max ~ √n · m ≈ {Math.round(Math.sqrt(r.totalNodes) * r.edgesPerNode)}<br/>
          • Clustering  C ~ (ln n)² / n  → 0  as n → ∞<br/>
          • Average path length  ℓ ~ ln n / ln(ln n)<br/>
          • Growth + preferential attachment are both necessary for scale-free topology
        </p>
      </div>
    </>
  );
}


// ── Watts–Strogatz Panel ──────────────────────────────────────────────────────
function WSPanel({ r }) {
  const pct = v => (v * 100).toFixed(1) + "%";
  const isSmallWorld = r.isSmallWorld;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        <span className="text-4xl">🕸</span>
        <div>
          <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Watts–Strogatz Small-World Graph</p>
          <p className="font-bold text-gray-800 text-lg">WS({r.nodes}, k={r.k}, β={r.rewiringProbability})</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {r.rewiredEdges} edge{r.rewiredEdges !== 1 ? "s" : ""} rewired out of {r.totalEdges} total
          </p>
        </div>
      </div>

      {/* Small-world verdict */}
      <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs ${isSmallWorld ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
        <span className="text-base mt-0.5">{isSmallWorld ? "✅" : "ℹ️"}</span>
        <div>
          <p className={`font-semibold ${isSmallWorld ? "text-green-800" : "text-gray-700"}`}>
            {isSmallWorld ? "Small-World Property Detected" : "Borderline small-world regime"}
          </p>
          <p className="text-gray-600 mt-0.5">
            High clustering ({r.clusteringCoefficient}) with short average path length ({r.avgPathLength} hops).
            A random graph would have clustering ≈ {r.randomGraphClustering}.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Nodes" value={r.nodes} accent="#10b981" />
        <StatCard label="Total edges" value={r.totalEdges} accent="#10b981" />
        <StatCard label="Rewired" value={r.rewiredEdges} sub={`β=${r.rewiringProbability}`} accent="#f59e0b" />
        <StatCard label="Components" value={r.connectedComponents} accent={r.connectedComponents === 1 ? "#22c55e" : "#ef4444"} />
      </div>

      {/* Clustering vs path length – the key WS trade-off */}
      <Collapsible title="Clustering & Path Length"  defaultOpen>
        <div className="space-y-1.5">
          <MetricRow label="Clustering coefficient" value={r.clusteringCoefficient} sub={`(theory: ${r.theoreticalClustering})`} highlight />
          <MetricRow label="Random-graph clustering" value={r.randomGraphClustering} />
          <MetricRow label="Avg path length (sampled)" value={r.avgPathLength} sub="hops" highlight />
          <MetricRow label="Est. random-graph path len" value={r.estimatedRandomPathLen} />
        </div>
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 text-xs text-emerald-800">
          <p className="font-semibold mb-1">The Small-World Regime</p>
          <p>
            As β increases from 0→1, clustering drops slowly while average path length drops fast.
            The "sweet spot" (β ≈ 0.01–0.1) gives <em>high clustering</em> + <em>short paths</em> — the small-world effect.
          </p>
        </div>
      </Collapsible>

      {/* Degree stats */}
      <Collapsible title="Degree Statistics">
        <div className="space-y-1.5">
          <MetricRow label="Average degree" value={r.avgDegree} sub={`(initial k = ${r.k})`} />
          <MetricRow label="Max degree" value={r.maxDegree} />
          <MetricRow label="Min degree" value={r.minDegree} />
          <MetricRow label="Density" value={pct(r.density)} />
        </div>
        <div className="mt-3 p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600">
          WS rewiring preserves total edge count and keeps degrees near k.
          Unlike BA graphs, WS degree distributions are narrow (no power-law hubs).
        </div>
      </Collapsible>
    </>
  );
}

function GraphGenPanel({ r }) {
  const data = r.result ?? r;
  const alg = data.algorithm ?? "";
  if (alg.includes("Erdos"))    return <ERPanel r={data} />;
  if (alg.includes("Barabasi")) return <BAPanel r={data} />;
  if (alg.includes("Watts"))    return <WSPanel r={data} />;
  // Fallback
  const skip = new Set(["steps", "result"]);
  const fields = Object.entries(data).filter(([k]) => !skip.has(k));
  return (
    <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 space-y-2">
      <p className="font-bold text-sky-800 text-sm">Graph Generated</p>
      {fields.map(([k, v]) => (
        <div key={k} className="flex justify-between text-xs text-gray-600">
          <span className="capitalize">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
          <span className="font-mono font-semibold">{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

function CascadePanel({ r }) {
  const data = r.result ?? r;
  const total = data.totalInfluenced ?? "?";
  const steps = data.timeSteps ?? "?";
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
        
          <p className="text-xs text-emerald-700 font-semibold mt-1 uppercase tracking-wide">Nodes Influenced</p>
          <p className="text-3xl font-bold text-emerald-800">{total}</p>
        </div>
        <div className="flex flex-col items-center p-4 rounded-xl bg-sky-50 border border-sky-200">
         
          <p className="text-xs text-sky-700 font-semibold mt-1 uppercase tracking-wide">Cascade Steps</p>
          <p className="text-3xl font-bold text-sky-800">{steps}</p>
        </div>
      </div>
      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 leading-relaxed">
        Starting from the seed node(s), each infected node attempts to activate its neighbours
        with the given probability at each time step.
      </p>
    </>
  );
}

// ─── Algo metadata ────────────────────────────────────────────────────────────

const ALGO_META = {
  "Structural Balance":          {  label: "Structural Balance"          },
  "Structural Balance (Greedy)": {   label: "Structural Balance (Greedy)" },
  "PageRank":                    {   label: "PageRank"                    },
  "HITS":                        {   label: "HITS — Hubs & Authorities"   },
  "Dijkstra":                    {  label: "Dijkstra Shortest Path"      },
  "Degree Centrality":           {   label: "Degree Centrality"           },
  "Closeness Centrality":        {   label: "Closeness Centrality"        },
  "Betweenness Centrality":      {   label: "Betweenness Centrality"      },
  "Label Propagation Community Detection": {  label: "Community Detection" },
  "Independent Cascade Model":   {   label: "Information Cascade"         },
  "Erdos-Renyi Random Graph":    {  label: "Erdős–Rényi Random Graph"    },
  "Barabasi-Albert (True Preferential Attachment)": { icon: "🌐", label: "Barabási–Albert Graph" },
  "Watts-Strogatz Small World Model": {  label: "Watts–Strogatz Graph"   },
};

// ─── Main export ──────────────────────────────────────────────────────────────

const AnalysisResults = ({ results }) => {
  if (!results) return null;

  // Some callers pass the whole response object (with nested .result).
  // Normalise: if there's a nested .result with an .algorithm, use that.
  const r = (results.result && results.result.algorithm) ? results.result : results;

  const alg  = r.algorithm ?? "";
  const meta = ALGO_META[alg] ?? { icon: "🔬", label: alg || "Results" };

  const renderBody = () => {
    if (alg.startsWith("Structural Balance"))         return <BalancePanel    r={r} />;
    if (alg === "PageRank")                           return <PageRankPanel   r={r} />;
    if (alg === "HITS")                               return <HitsPanel       r={r} />;
    if (alg === "Dijkstra")                           return <DijkstraPanel   r={r} />;
    if (alg.includes("Centrality"))                   return <CentralityPanel r={r} />;
    if (alg.includes("Community") || alg.includes("Label Propagation")) return <CommunityPanel r={r} />;
    if (alg.includes("Cascade"))                      return <CascadePanel    r={r} />;
    if (alg.includes("Erdos") || alg.includes("Barabasi") || alg.includes("Watts"))
      return <GraphGenPanel r={r} />;
    return <GraphGenPanel r={r} />;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)" }}
      >
        <div>
          <p className="text-xs text-yellow-900 font-semibold uppercase tracking-widest opacity-80">
            Analysis Results
          </p>
          <h2 className="text-base font-bold text-white leading-tight mt-0.5">{meta.label}</h2>
        </div>
        <span className="text-3xl">{meta.icon}</span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">{renderBody()}</div>
    </div>
  );
};

export default AnalysisResults;