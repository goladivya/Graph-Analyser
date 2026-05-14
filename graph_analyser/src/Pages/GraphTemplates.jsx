import React, { useState } from "react";



const TEMPLATES = [

  // ── Dijkstra ────────────────────────────────────────────────────────────────
  {
    id: "dijkstra-classic",
    label: "Dijkstra — Classic",
    algo: "Dijkstra",
    
    description: "6-node weighted graph. Try source=A, target=F to find the shortest path.",
    hint: "Source: A  ·  Target: F",
    elements: [
      { data: { id:"A", label:"A" }, position: { x:100, y:200 } },
      { data: { id:"B", label:"B" }, position: { x:250, y:100 } },
      { data: { id:"C", label:"C" }, position: { x:250, y:300 } },
      { data: { id:"D", label:"D" }, position: { x:400, y:100 } },
      { data: { id:"E", label:"E" }, position: { x:400, y:300 } },
      { data: { id:"F", label:"F" }, position: { x:550, y:200 } },
      { data: { id:"AB", source:"A", target:"B", weight:4,  directed:false } },
      { data: { id:"AC", source:"A", target:"C", weight:2,  directed:false } },
      { data: { id:"BC", source:"B", target:"C", weight:1,  directed:false } },
      { data: { id:"BD", source:"B", target:"D", weight:5,  directed:false } },
      { data: { id:"CE", source:"C", target:"E", weight:8,  directed:false } },
      { data: { id:"DE", source:"D", target:"E", weight:2,  directed:false } },
      { data: { id:"DF", source:"D", target:"F", weight:6,  directed:false } },
      { data: { id:"EF", source:"E", target:"F", weight:3,  directed:false } },
    ],
  },

  {
    id: "dijkstra-directed",
    label: "Dijkstra — Directed",
    algo: "Dijkstra",
    
    description: "Directed weighted graph. Shows how direction blocks some shortest paths.",
    hint: "Source: S  ·  Target: T",
    elements: [
      { data: { id:"S",  label:"S"  }, position: { x:80,  y:200 } },
      { data: { id:"N1", label:"N1" }, position: { x:220, y:100 } },
      { data: { id:"N2", label:"N2" }, position: { x:220, y:300 } },
      { data: { id:"N3", label:"N3" }, position: { x:360, y:200 } },
      { data: { id:"T",  label:"T"  }, position: { x:500, y:200 } },
      { data: { id:"e1", source:"S",  target:"N1", weight:1, directed:true } },
      { data: { id:"e2", source:"S",  target:"N2", weight:4, directed:true } },
      { data: { id:"e3", source:"N1", target:"N3", weight:2, directed:true } },
      { data: { id:"e4", source:"N2", target:"N3", weight:1, directed:true } },
      { data: { id:"e5", source:"N3", target:"T",  weight:3, directed:true } },
      { data: { id:"e6", source:"N1", target:"N2", weight:1, directed:true } },
    ],
  },

  // ── Structural Balance ───────────────────────────────────────────────────────
  {
    id: "balance-triangle-balanced",
    label: "Balance — Balanced Triangles",
    algo: "Structural Balance",
   
    description: "All triangles are balanced: +++ and +−− only. Should detect perfect balance.",
    hint: "Run: Check Balance",
    elements: [
      { data: { id:"A", label:"A" }, position: { x:200, y:100 } },
      { data: { id:"B", label:"B" }, position: { x:100, y:280 } },
      { data: { id:"C", label:"C" }, position: { x:300, y:280 } },
      { data: { id:"D", label:"D" }, position: { x:440, y:180 } },
      { data: { id:"AB", source:"A", target:"B", sign: 1,  directed:false, label:"+" } },
      { data: { id:"AC", source:"A", target:"C", sign: 1,  directed:false, label:"+" } },
      { data: { id:"BC", source:"B", target:"C", sign: 1,  directed:false, label:"+" } },
      { data: { id:"CD", source:"C", target:"D", sign:-1,  directed:false, label:"−" } },
      { data: { id:"AD", source:"A", target:"D", sign:-1,  directed:false, label:"−" } },
    ],
  },

  {
    id: "balance-unbalanced",
    label: "Balance — Unbalanced Graph",
    algo: "Structural Balance",
   
    description: "Contains a −−− triangle which is always unbalanced. Use greedy repair to fix it.",
    hint: "Run: Check Balance, then Make Balanced",
    elements: [
      { data: { id:"A", label:"A" }, position: { x:200, y:80  } },
      { data: { id:"B", label:"B" }, position: { x:80,  y:260 } },
      { data: { id:"C", label:"C" }, position: { x:320, y:260 } },
      { data: { id:"D", label:"D" }, position: { x:200, y:380 } },
      { data: { id:"AB", source:"A", target:"B", sign:-1, directed:false, label:"−" } },
      { data: { id:"AC", source:"A", target:"C", sign:-1, directed:false, label:"−" } },
      { data: { id:"BC", source:"B", target:"C", sign:-1, directed:false, label:"−" } },
      { data: { id:"BD", source:"B", target:"D", sign: 1, directed:false, label:"+" } },
      { data: { id:"CD", source:"C", target:"D", sign: 1, directed:false, label:"+" } },
    ],
  },

  // ── PageRank ─────────────────────────────────────────────────────────────────
  {
    id: "pagerank-hub",
    label: "PageRank — Hub Network",
    algo: "PageRank",
  
    description: "One central hub pointed to by all others. Watch it dominate the PageRank score.",
    hint: "Hub = node H. Expected top rank: H",
    elements: [
      { data: { id:"H",  label:"H"  }, position: { x:300, y:220 } },
      { data: { id:"N1", label:"N1" }, position: { x:160, y:100 } },
      { data: { id:"N2", label:"N2" }, position: { x:440, y:100 } },
      { data: { id:"N3", label:"N3" }, position: { x:160, y:340 } },
      { data: { id:"N4", label:"N4" }, position: { x:440, y:340 } },
      { data: { id:"N5", label:"N5" }, position: { x:300, y:60  } },
      { data: { id:"e1", source:"N1", target:"H",  directed:true } },
      { data: { id:"e2", source:"N2", target:"H",  directed:true } },
      { data: { id:"e3", source:"N3", target:"H",  directed:true } },
      { data: { id:"e4", source:"N4", target:"H",  directed:true } },
      { data: { id:"e5", source:"N5", target:"H",  directed:true } },
      { data: { id:"e6", source:"H",  target:"N1", directed:true } },
      { data: { id:"e7", source:"N1", target:"N2", directed:true } },
      { data: { id:"e8", source:"N3", target:"N4", directed:true } },
    ],
  },

  {
    id: "pagerank-chain",
    label: "PageRank — Rank Sink",
    algo: "PageRank",
   
    description: "A chain graph with a dangling sink node. Demonstrates how damping redistributes rank.",
    hint: "Notice how rank flows toward the sink",
    elements: [
      { data: { id:"A", label:"A" }, position: { x:80,  y:200 } },
      { data: { id:"B", label:"B" }, position: { x:220, y:200 } },
      { data: { id:"C", label:"C" }, position: { x:360, y:200 } },
      { data: { id:"D", label:"D" }, position: { x:500, y:200 } },
      { data: { id:"E", label:"E" }, position: { x:360, y:340 } },
      { data: { id:"e1", source:"A", target:"B", directed:true } },
      { data: { id:"e2", source:"B", target:"C", directed:true } },
      { data: { id:"e3", source:"C", target:"D", directed:true } },
      { data: { id:"e4", source:"C", target:"E", directed:true } },
      { data: { id:"e5", source:"B", target:"A", directed:true } },
    ],
  },

  // ── HITS ─────────────────────────────────────────────────────────────────────
  {
    id: "hits-classic",
    label: "HITS — Hub & Authority",
    algo: "HITS",
  
    description: "Hub nodes (H1, H2) point to authority nodes (A1, A2). Classic HITS structure.",
    hint: "Expected: A1 & A2 = top authorities, H1 & H2 = top hubs",
    elements: [
      { data: { id:"H1", label:"H1" }, position: { x:100, y:150 } },
      { data: { id:"H2", label:"H2" }, position: { x:100, y:300 } },
      { data: { id:"A1", label:"A1" }, position: { x:400, y:150 } },
      { data: { id:"A2", label:"A2" }, position: { x:400, y:300 } },
      { data: { id:"M",  label:"M"  }, position: { x:250, y:225 } },
      { data: { id:"e1", source:"H1", target:"A1", directed:true } },
      { data: { id:"e2", source:"H1", target:"A2", directed:true } },
      { data: { id:"e3", source:"H2", target:"A1", directed:true } },
      { data: { id:"e4", source:"H2", target:"A2", directed:true } },
      { data: { id:"e5", source:"M",  target:"A1", directed:true } },
      { data: { id:"e6", source:"H1", target:"M",  directed:true } },
    ],
  },

  // ── Centrality ────────────────────────────────────────────────────────────────
  {
    id: "centrality-bridge",
    label: "Centrality — Bridge Node",
    algo: "Centrality",
  
    description: "Two clusters connected by a bridge node B. B should have highest betweenness; cluster centers highest closeness.",
    hint: "Run all three centrality measures and compare",
    elements: [
      { data: { id:"A1", label:"A1" }, position: { x:60,  y:140 } },
      { data: { id:"A2", label:"A2" }, position: { x:60,  y:280 } },
      { data: { id:"A3", label:"A3" }, position: { x:180, y:210 } },
      { data: { id:"B",  label:"B"  }, position: { x:310, y:210 } },
      { data: { id:"C1", label:"C1" }, position: { x:440, y:140 } },
      { data: { id:"C2", label:"C2" }, position: { x:440, y:280 } },
      { data: { id:"C3", label:"C3" }, position: { x:560, y:210 } },
      { data: { id:"e1", source:"A1", target:"A3", directed:false } },
      { data: { id:"e2", source:"A2", target:"A3", directed:false } },
      { data: { id:"e3", source:"A1", target:"A2", directed:false } },
      { data: { id:"e4", source:"A3", target:"B",  directed:false } },
      { data: { id:"e5", source:"B",  target:"C1", directed:false } },
      { data: { id:"e6", source:"C1", target:"C3", directed:false } },
      { data: { id:"e7", source:"C2", target:"C3", directed:false } },
      { data: { id:"e8", source:"C1", target:"C2", directed:false } },
    ],
  },

  // ── Community Detection ───────────────────────────────────────────────────────
  {
    id: "community-three-clusters",
    label: "Community — 3 Clear Clusters",
    algo: "Community Detection",
   
    description: "Three tightly-connected groups with sparse inter-cluster edges. Label propagation should find all three.",
    hint: "Should detect 3 communities",
    elements: [
      // Cluster 1
      { data: { id:"A1", label:"A1" }, position: { x:80,  y:120 } },
      { data: { id:"A2", label:"A2" }, position: { x:160, y:80  } },
      { data: { id:"A3", label:"A3" }, position: { x:160, y:180 } },
      // Cluster 2
      { data: { id:"B1", label:"B1" }, position: { x:320, y:80  } },
      { data: { id:"B2", label:"B2" }, position: { x:400, y:140 } },
      { data: { id:"B3", label:"B3" }, position: { x:320, y:200 } },
      // Cluster 3
      { data: { id:"C1", label:"C1" }, position: { x:240, y:320 } },
      { data: { id:"C2", label:"C2" }, position: { x:340, y:360 } },
      { data: { id:"C3", label:"C3" }, position: { x:160, y:360 } },
      // Intra-cluster edges
      { data: { id:"a12", source:"A1", target:"A2", directed:false } },
      { data: { id:"a13", source:"A1", target:"A3", directed:false } },
      { data: { id:"a23", source:"A2", target:"A3", directed:false } },
      { data: { id:"b12", source:"B1", target:"B2", directed:false } },
      { data: { id:"b13", source:"B1", target:"B3", directed:false } },
      { data: { id:"b23", source:"B2", target:"B3", directed:false } },
      { data: { id:"c12", source:"C1", target:"C2", directed:false } },
      { data: { id:"c13", source:"C1", target:"C3", directed:false } },
      { data: { id:"c23", source:"C2", target:"C3", directed:false } },
      // Sparse inter-cluster bridges
      { data: { id:"ab",  source:"A3", target:"B1", directed:false } },
      { data: { id:"bc",  source:"B3", target:"C1", directed:false } },
      { data: { id:"ac",  source:"A1", target:"C3", directed:false } },
    ],
  },

  // ── Information Cascade ───────────────────────────────────────────────────────
  {
    id: "ic-small-world",
    label: "IC — Small World Spread",
    algo: "Information Cascade",
  
    description: "Ring-lattice-style graph. Spread from S1. Observe how cascade depth correlates with path length.",
    hint: "Seed: S1  ·  Probability: 0.5",
    elements: [
      { data: { id:"S1", label:"S1" }, position: { x:300, y:60  } },
      { data: { id:"N1", label:"N1" }, position: { x:480, y:140 } },
      { data: { id:"N2", label:"N2" }, position: { x:520, y:300 } },
      { data: { id:"N3", label:"N3" }, position: { x:380, y:420 } },
      { data: { id:"N4", label:"N4" }, position: { x:200, y:420 } },
      { data: { id:"N5", label:"N5" }, position: { x:80,  y:300 } },
      { data: { id:"N6", label:"N6" }, position: { x:120, y:140 } },
      { data: { id:"e1", source:"S1", target:"N1", probability:0.6, directed:true } },
      { data: { id:"e2", source:"N1", target:"N2", probability:0.5, directed:true } },
      { data: { id:"e3", source:"N2", target:"N3", probability:0.5, directed:true } },
      { data: { id:"e4", source:"N3", target:"N4", probability:0.5, directed:true } },
      { data: { id:"e5", source:"N4", target:"N5", probability:0.5, directed:true } },
      { data: { id:"e6", source:"N5", target:"N6", probability:0.5, directed:true } },
      { data: { id:"e7", source:"S1", target:"N4", probability:0.3, directed:true } },
      { data: { id:"e8", source:"N1", target:"N3", probability:0.3, directed:true } },
    ],
  },

  {
    id: "ic-influencer",
    label: "IC — Influencer Node",
    algo: "Information Cascade",
  
    description: "One high-degree influencer connected to many followers. Demonstrates viral spread.",
    hint: "Seed: INF  ·  Try probability 0.3 vs 0.7",
    elements: [
      { data: { id:"INF", label:"INF" }, position: { x:300, y:220 } },
      ...Array.from({length:8}, (_, i) => {
        const angle = (i / 8) * 2 * Math.PI;
        return { data: { id:`F${i+1}`, label:`F${i+1}` },
                 position: { x: 300 + 200*Math.cos(angle), y: 220 + 180*Math.sin(angle) } };
      }),
      ...Array.from({length:8}, (_, i) => ({
        data: { id:`ef${i+1}`, source:"INF", target:`F${i+1}`, probability:0.5, directed:true }
      })),
      { data: { id:"eff12", source:"F1", target:"F2", probability:0.4, directed:true } },
      { data: { id:"eff34", source:"F3", target:"F4", probability:0.4, directed:true } },
      { data: { id:"eff56", source:"F5", target:"F6", probability:0.4, directed:true } },
    ],
  },
];

// ── Group templates by algorithm ──────────────────────────────────────────────
const GROUPS = [
  { key: "Dijkstra",               label: "Shortest Path"       },
  { key: "Structural Balance",      label: "Structural Balance"  },
  { key: "PageRank",               label: "PageRank"            },
  { key: "HITS",                  label: "HITS"                },
  { key: "Centrality",            label: "Centrality"          },
  { key: "Community Detection",   label: "Community"           },
  { key: "Information Cascade",    label: "Info Cascade"        },
];

// ─────────────────────────────────────────────────────────────────────────────

const GraphTemplates = ({ onLoad }) => {
  const [open, setOpen]           = useState(false);
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].key);
  const [loaded, setLoaded]       = useState(null);

  const filtered = TEMPLATES.filter(t => t.algo === activeGroup);

  const handleLoad = (tpl) => {
    onLoad(tpl.elements);
    setLoaded(tpl.id);
    setTimeout(() => setLoaded(null), 1500);
  };

  return (
    <div style={{ background:"#fff", borderRadius:"14px", boxShadow:"0 1px 6px rgba(0,0,0,0.08)", overflow:"hidden" }}>

      {/* Header – click to expand/collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"13px 16px", background: open ? "#fefce8" : "#fff",
          borderBottom: open ? "1px solid #fef08a" : "none",
          border:"none", cursor:"pointer", transition:"background .15s",
        }}
      >
        <span style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          
          <span style={{ fontSize:"13px", fontWeight:700, color:"#1f2937" }}>Graph Templates</span>
          <span style={{ fontSize:"11px", fontWeight:500, color:"#9ca3af",
                          background:"#f3f4f6", padding:"2px 7px", borderRadius:"99px" }}>
            {TEMPLATES.length} graphs
          </span>
        </span>
        <span style={{ fontSize:"11px", color:"#9ca3af" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding:"12px" }}>

          {/* Algorithm group pills */}
          <div style={{ display:"flex", flexWrap:"wrap", gap:"5px", marginBottom:"12px" }}>
            {GROUPS.map(g => (
              <button
                key={g.key}
                onClick={() => setActiveGroup(g.key)}
                style={{
                  padding:"4px 10px", borderRadius:"99px", fontSize:"11px", fontWeight:600,
                  cursor:"pointer", border:"none", transition:"all .15s",
                  background: activeGroup === g.key ? "#facc15" : "#f3f4f6",
                  color:      activeGroup === g.key ? "#fff"    : "#6b7280",
                  boxShadow:  activeGroup === g.key ? "0 1px 4px rgba(250,204,21,0.4)" : "none",
                }}
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>

          {/* Template cards */}
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {filtered.map(tpl => (
              <div
                key={tpl.id}
                style={{
                  border:"1px solid #e5e7eb", borderRadius:"12px", padding:"12px",
                  background: loaded === tpl.id ? "#f0fdf4" : "#fafafa",
                  transition:"all .2s",
                }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:"12px", fontWeight:700, color:"#1f2937", margin:"0 0 3px" }}>
                      {tpl.icon} {tpl.label}
                    </p>
                    <p style={{ fontSize:"11px", color:"#6b7280", margin:"0 0 5px", lineHeight:1.4 }}>
                      {tpl.description}
                    </p>
                    {tpl.hint && (
                      <p style={{ fontSize:"10px", color:"#f59e0b", fontWeight:600,
                                   background:"#fffbeb", padding:"3px 8px", borderRadius:"6px",
                                   display:"inline-block", margin:0 }}>
                         {tpl.hint}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleLoad(tpl)}
                    style={{
                      marginLeft:"10px", flexShrink:0,
                      padding:"6px 14px", borderRadius:"8px", fontSize:"12px", fontWeight:700,
                      cursor:"pointer", border:"none", transition:"all .15s",
                      background: loaded === tpl.id ? "#22c55e" : "#facc15",
                      color:"#fff",
                      boxShadow:"0 1px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {loaded === tpl.id ? "✓ Loaded" : "Load"}
                  </button>
                </div>
                <p style={{ fontSize:"10px", color:"#d1d5db", margin:"6px 0 0",
                              fontFamily:"monospace" }}>
                  {tpl.elements.filter(e => !e.data.source).length} nodes ·{" "}
                  {tpl.elements.filter(e =>  e.data.source).length} edges
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphTemplates;
