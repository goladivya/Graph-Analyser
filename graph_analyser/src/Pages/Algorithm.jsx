import React, { useState, useEffect } from "react";
import cytoscape from "cytoscape";

const AlgorithmPanel = ({ cyRef }) => {
  const [activeTab, setActiveTab] = useState("algorithms");
  const [properties, setProperties] = useState(null);

  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    function calculateProperties() {
      const nodes = cy.nodes();
      const edges = cy.edges();
      const n = nodes.length;
      const m = edges.length;

      if (n === 0) return;


      const size = m;

      // Density
      const density =
        cy.edges().some(e => e.data("directed"))
          ? m / (n * (n - 1))
          : (2 * m) / (n * (n - 1));

      const degrees = nodes.map(n => n.degree());
      const minDeg = Math.min(...degrees);
      const maxDeg = Math.max(...degrees);
      const avgDeg = degrees.reduce((a, b) => a + b, 0) / n;

      // Connectivity
      const components = cy.elements().components();
      const connectedComponents = components.length;
      const isolatedNodes = nodes.filter(n => n.degree() === 0).length;

      // Cycles
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
          const target =
            e.source().id() === node.id() ? e.target() : e.source();
          dfs(target);
        });
        stack.delete(node.id());
      }
      nodes.forEach(n => {
        if (!visited.has(n.id())) dfs(n);
      });




      // Clustering coefficient (basic local)
      let clusteringCoeff = 0;
      nodes.forEach(v => {
        const neighbors = v.neighborhood("node");
        const k = neighbors.length;
        if (k > 1) {
          let links = 0;
          neighbors.forEach(u => {
            neighbors.forEach(w => {
              if (u.id() !== w.id() && cy.getElementById(u.id()).edgesWith(w).length > 0) {
                links++;
              }
            });
          });
          clusteringCoeff += links / (k * (k - 1));
        }
      });
      clusteringCoeff /= n;

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
    // re-calc when graph changes
    cy.on("add remove data", calculateProperties);
    return () => {
      cy.removeListener("add remove data", calculateProperties);
    };

  }, [cyRef, activeTab]);
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
            <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg">
              <div className="font-medium text-gray-800">Dijkstra's Algorithm</div>
              <div className="text-sm text-gray-600">Shortest path finder</div>
            </button>
            <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg">
              <div className="font-medium text-gray-800">Structural Balance</div>
              <div className="text-sm text-gray-600">Social network analysis</div>
            </button>
            <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg">
              <div className="font-medium text-gray-800">BFS Traversal</div>
              <div className="text-sm text-gray-600">Breadth-first search</div>
            </button>
            <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg">
              <div className="font-medium text-gray-800">DFS Traversal</div>
              <div className="text-sm text-gray-600">Depth-first search</div>
            </button>
            <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg">
              <div className="font-medium text-gray-800">PageRank</div>
              <div className="text-sm text-gray-600">Node importance ranking</div>
            </button>
          </>
        )}

        {activeTab === "properties" && (
          properties ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition">
                <p className="text-xs text-gray-500">Size</p>
                <p className="text-lg font-semibold text-gray-800">{properties.size}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition">
                <p className="text-xs text-gray-500">Density</p>
                <p className="text-lg font-semibold text-gray-800">{properties.density}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition sm:col-span-2">
                <p className="text-xs text-gray-500">Degree Info</p>
                <p className="text-sm text-gray-700">
                  min: <b>{properties.minDeg}</b>, max: <b>{properties.maxDeg}</b>, avg: <b>{properties.avgDeg}</b>
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition">
                <p className="text-xs text-gray-500">Connectivity</p>
                <p className="text-sm text-gray-700">
                  {properties.connectedComponents} components<br />
                  {properties.isolatedNodes} isolated nodes
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition">
                <p className="text-xs text-gray-500">Cycles Present</p>
                <p className={`text-lg font-semibold ${properties.hasCycle === "Yes" ? "text-red-600" : "text-green-600"}`}>
                  {properties.hasCycle}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg shadow-sm hover:bg-yellow-50 transition sm:col-span-2">
                <p className="text-xs text-gray-500">Clustering Coefficient</p>
                <p className="text-lg font-semibold text-gray-800">{properties.clusteringCoeff}</p>
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
