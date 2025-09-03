import React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import edgehandles from "cytoscape-edgehandles";

cytoscape.use(edgehandles);

const GraphCanvas = ({ elements, setElements, cyRef }) => {
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
      cyRef.current.center();
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
      cyRef.current.center();
    }
  };

  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400 h-[600px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Graph Canvas</h2>
        <div className="flex items-center space-x-2">
          <button className="p-2 bg-gray-100 hover:bg-yellow-100 rounded-full" onClick={handleZoomIn}>
            <span className="material-symbols-outlined">zoom_in</span>
          </button>
          <button className="p-2 bg-gray-100 hover:bg-yellow-100 rounded-full" onClick={handleZoomOut}>
            <span className="material-symbols-outlined">zoom_out</span>
          </button>
          <button className="p-2 bg-gray-100 hover:bg-yellow-100 rounded-full" onClick={handleReset}>
            <span className="material-symbols-outlined">center_focus_weak</span>
          </button>
        </div>
      </div>

      <div className="w-full h-[500px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <CytoscapeComponent
          elements={elements}
          style={{ width: "100%", height: "100%" }}
          stylesheet={[
            {
              selector: "node",
              style: {
                backgroundColor: "#fde047",
                label: "data(label)",
                "text-valign": "center",
                "text-halign": "center",
                "border-width": 3,
                "border-color": "#eab308",
              },
            },
            {
              selector: "edge",
              style: {
                width: 2,
                label: "data(weight)",
                "curve-style": "straight",
                "target-arrow-shape": "triangle",
                "line-color": "#6b7280",
                "target-arrow-color": "#6b7280",
              },
            },
          ]}
          cy={(cy) => {
            cyRef.current = cy;
            if (cy._initialized) return;
            cy._initialized = true;

            cy.on("tap", (evt) => {
              if (evt.target === cy) {
                const id = `n${Date.now()}`;
                setElements((prev) => [
                  ...prev,
                  {
                    data: { id, label: id.toUpperCase() },
                    position: { x: evt.position.x, y: evt.position.y },
                  },
                ]);
              }
            });

            const eh = cy.edgehandles({ handleNodes: "node", snap: true });
            eh.enable();

            cy.on("ehcomplete", (event, sourceNode, targetNode, addedEles) => {
              addedEles.remove();
              const newEdge = {
                data: {
                  id: `e${Date.now()}`,
                  source: sourceNode.id(),
                  target: targetNode.id(),
                  weight: 1,
                },
              };
              setElements((prev) => [...prev, newEdge]);
            });

            cy.on("cxttap", "node", (evt) => {
              const node = evt.target;
              const newLabel = prompt("Enter new label:", node.data("label"));
              if (newLabel) {
                node.data("label", newLabel);
              }
            });
          }}
        />
      </div>
    </div>
  );
};

export default GraphCanvas;
