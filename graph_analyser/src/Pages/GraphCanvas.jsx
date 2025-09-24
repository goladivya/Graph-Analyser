import React, { useState } from "react";
import CytoscapeComponent from "react-cytoscapejs";
//import cytoscape from "cytoscape";
import "./style.css";

const GraphCanvas = ({ elements, setElements, cyRef }) => {
    const [isDirected, setIsDirected] = useState(true);
     const [showDropdown, setShowDropdown] = useState(false);

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

  

    const handleGenerateGraph = (type) => {
        setShowDropdown(false);

        if (type === "empty") {
            // Clear graph
            setElements([]);
            if (cyRef.current) cyRef.current.elements().remove();
        } 
        else if (type === "random") {
            const numNodes = parseInt(prompt("Enter number of nodes:", 5));
            if (isNaN(numNodes) || numNodes <= 0) return;

             const directed = window.confirm("Should the graph be directed? (OK = Directed, Cancel = Undirected)");
             setIsDirected(directed);

            let newElements = [];

            // Nodes
            for (let i = 0; i < numNodes; i++) {
                newElements.push({
                    data: { id: `n${i}`, label: `N${i}` },
                    position: {
                        x: Math.random() * 400 + 50,
                        y: Math.random() * 400 + 50,
                    },
                });
            }

            // Random edges
            for (let i = 0; i < numNodes; i++) {
                const target = Math.floor(Math.random() * numNodes);
                if (target !== i) {
                    newElements.push({
                        data: {
                            id: `e${i}-${target}`,
                            source: `n${i}`,
                            target: `n${target}`,
                            weight: Math.floor(Math.random() * 10) + 1,
                        },
                        classes: directed ? "directed" : "undirected",
                    });
                }
            }

            setElements(newElements);
            if (cyRef.current) {
                cyRef.current.elements().remove();
                cyRef.current.add(newElements);
                cyRef.current.fit();
            }
        }
    };

    

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400 h-[600px]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Graph Canvas</h2>
                <div className="flex items-center space-x-2">
                    <div className="relative">
                    <button
                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold rounded-lg shadow-sm"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        New Graph
                    </button>

                    {/* Dropdown menu */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 shadow-lg z-20">
                    <button
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 hover:text-gray-900"
                        onClick={() => handleGenerateGraph("empty")}
                    >
                        Create Graph
                    </button>
                    <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-yellow-100 hover:text-gray-900"
                        onClick={() => handleGenerateGraph("random")}
                    >
                        Random Graph
                    </button>
                    </div>
                )}
                </div>
                    <button
                        className="p-2 bg-gray-100 hover:bg-yellow-100 rounded-full"
                        onClick={handleZoomIn}
                    >
                        <span className="material-symbols-outlined">zoom_in</span>
                    </button>
                    <button
                        className="p-2 bg-gray-100 hover:bg-yellow-100 rounded-full"
                        onClick={handleZoomOut}
                    >
                        <span className="material-symbols-outlined">zoom_out</span>
                    </button>
                    <button
                        className="p-2 bg-gray-100 hover:bg-yellow-100 rounded-full"
                        onClick={handleReset}
                    >
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
                            selector: "edge.directed",
                            style: {
                                width: 2,
                                label: "data(weight)",
                                "curve-style": "straight",
                                "target-arrow-shape": "triangle",
                                "line-color": "#6b7280",
                                "target-arrow-color": "#6b7280",
                            },
                        },
                        {
                            selector: "edge.undirected",
                            style: {
                                width: 2,
                                label: "data(weight)",
                                "curve-style": "straight",
                                "target-arrow-shape": "none",
                                "line-color": "#6b7280",
                            },
                        },
                    ]}
                    cy={(cy) => {
                        cyRef.current = cy;
                        if (cy._initialized) return;
                        cy._initialized = true;

                        // Select node/edge
                        cy.on("tap", "node, edge", (evt) => {
                            cy.$("node, edge").unselect();
                            evt.target.select();
                        });

                        // Delete on Backspace/Delete
                        document.addEventListener("keydown", (e) => {
                            if (
                                (e.key === "Delete" || e.key === "Backspace") &&
                                cy.$(":selected").length > 0
                            ) {
                                const selected = cy.$(":selected");
                                selected.remove();
                                setElements((prev) =>
                                    prev.filter(
                                        (el) => !selected.map((s) => s.id()).includes(el.data.id)
                                    )
                                );
                            }
                        });

                        // Add node on double-click
                        let lastClickTime = 0;
                        cy.on("tap", (evt) => {
                            if (evt.target === cy) {
                                const now = Date.now();
                                if (now - lastClickTime < 300) {
                                    const id = `n${Date.now()}`;
                                    setElements((prev) => [
                                        ...prev,
                                        {
                                            data: { id, label: id.toUpperCase() },
                                            position: {
                                                x: evt.position.x,
                                                y: evt.position.y,
                                            },
                                        },
                                    ]);
                                }
                                lastClickTime = now;
                            }
                        });

                        // ✅ Edge-adding logic (click 2 nodes)
                        let sourceNode = null;
                        cy.on("tap", "node", (evt) => {
                            const node = evt.target;
                            if (!sourceNode) {
                                sourceNode = node;
                                node.style("border-color", "red");
                            } else if (sourceNode.id() !== node.id()) {
                                const s = sourceNode.id();
                                const t = node.id();

                                const exists = cy.edges().some((e) => {
                                    if (isDirected) {
                                        return e.source().id() === s && e.target().id() === t;
                                    } else {
                                        return (
                                            (e.source().id() === s && e.target().id() === t) ||
                                            (e.source().id() === t && e.target().id() === s)
                                        );
                                    }
                                });

                                if (!exists) {
                                    const edgeId = isDirected
                                        ? `e${s}-${t}`
                                        : `e${[s, t].sort().join("-")}`;
                                    const newEdge = {
                                        data: { id: edgeId, source: s, target: t, weight: 1 },
                                        classes: isDirected ? "directed" : "undirected",
                                    };
                                    setElements((prev) => [...prev, newEdge]);
                                    cy.add(newEdge);
                                }

                                sourceNode.style("border-color", "#eab308");
                                sourceNode = null;
                            }
                        });

                        // ✅ Right-click: change weight + directed/undirected
                        cy.on("cxttap", "edge", (evt) => {
                            const edge = evt.target;
                            const currentWeight = edge.data("weight") || 1;
                            const newWeight = prompt("Enter new weight:", currentWeight);

                            if (newWeight && !isNaN(newWeight)) {
                                // Ask for directed or not
                                const makeDirected = window.confirm(
                                    "Should this edge be directed? (OK = Directed, Cancel = Undirected)"
                                );

                                // update edge data
                                edge.data("weight", Number(newWeight));
                                edge.removeClass("directed undirected");
                                edge.addClass(makeDirected ? "directed" : "undirected");

                                // update React state
                                setElements((prev) =>
                                    prev.map((el) =>
                                        el.data.id === edge.id()
                                            ? {
                                                  ...el,
                                                  data: {
                                                      ...el.data,
                                                      weight: Number(newWeight),
                                                  },
                                                  classes: makeDirected
                                                      ? "directed"
                                                      : "undirected",
                                              }
                                            : el
                                    )
                                );
                            }
                        });

                        // Right-click rename node
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
