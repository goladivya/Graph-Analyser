import React from "react";
import CytoscapeComponent from "react-cytoscapejs";
import { useState } from "react";

import "./style.css"

export const Component = () => {

     const [elements, setElements] = useState([
    { data: { id: "A", label: "A" }, position: { x: 150, y: 100 } },
    { data: { id: "B", label: "B" }, position: { x: 300, y: 150 } },
    { data: { id: "C", label: "C" }, position: { x: 450, y: 100 } },
    { data: { id: "D", label: "D" }, position: { x: 300, y: 280 } },
    { data: { id: "AB", source: "A", target: "B", weight: 5 } },
    { data: { id: "BC", source: "B", target: "C", weight: 3 } },
    { data: { id: "BD", source: "B", target: "D", weight: 7 } },
    { data: { id: "AD", source: "A", target: "D", weight: 2 } },
  ]);
    return (
        <div id="webcrumbs">
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
                <div className="max-w-7xl mx-auto">
                    <header className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-yellow-400">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">Graph Algorithm Analyzer</h1>
                                <p className="text-gray-600">
                                    Interactive tool for understanding networking algorithms
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md">
                                    <span className="material-symbols-outlined mr-2">save</span>
                                    Save Graph
                                </button>
                                <button className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md">
                                    <span className="material-symbols-outlined mr-2">upload</span>
                                    Load GML
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-400">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Graph Tools</h2>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Graph Type</label>
                                        <details className="relative">
                                            <summary className="bg-gray-100 hover:bg-gray-200 p-3 rounded-lg cursor-pointer transition-colors duration-200 flex justify-between items-center">
                                                <span>Undirected</span>
                                                <span className="material-symbols-outlined">expand_more</span>
                                            </summary>
                                            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1">
                                                <div className="p-2 hover:bg-yellow-50 cursor-pointer transition-colors duration-200">
                                                    Undirected
                                                </div>
                                                <div className="p-2 hover:bg-yellow-50 cursor-pointer transition-colors duration-200">
                                                    Directed
                                                </div>
                                            </div>
                                        </details>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Node Label</label>
                                        <input
                                            type="text"
                                            placeholder="Enter node label"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Edge Weight</label>
                                        <input
                                            type="number"
                                            placeholder="Enter weight"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-sm">
                                            <span className="material-symbols-outlined text-lg">add_circle</span>
                                            Add Node
                                        </button>
                                        <button className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-sm">
                                            <span className="material-symbols-outlined text-lg">trending_up</span>
                                            Add Edge
                                        </button>
                                    </div>

                                    <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md">
                                        <span className="material-symbols-outlined mr-2">clear</span>
                                        Clear Graph
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="flex border-b border-gray-200">
                                    <button className="flex-1 py-3 px-4 font-medium text-gray-700 hover:bg-yellow-50 transition-colors duration-200 border-b-2 border-yellow-400">
                                        <span className="material-symbols-outlined block mx-auto mb-1">
                                            account_tree
                                        </span>
                                        <span className="text-xs">Algorithms</span>
                                    </button>
                                    <button className="flex-1 py-3 px-4 font-medium text-gray-700 hover:bg-yellow-50 transition-colors duration-200">
                                        <span className="material-symbols-outlined block mx-auto mb-1">analytics</span>
                                        <span className="text-xs">Properties</span>
                                    </button>
                                    <button className="flex-1 py-3 px-4 font-medium text-gray-700 hover:bg-yellow-50 transition-colors duration-200">
                                        <span className="material-symbols-outlined block mx-auto mb-1">download</span>
                                        <span className="text-xs">Import/Export</span>
                                    </button>
                                </div>

                                <div className="p-4">
                                    <div className="space-y-2">
                                        <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200 border border-gray-200">
                                            <div className="font-medium text-gray-800">Dijkstra's Algorithm</div>
                                            <div className="text-sm text-gray-600">Shortest path finder</div>
                                        </button>
                                        <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200 border border-gray-200">
                                            <div className="font-medium text-gray-800">Structural Balance</div>
                                            <div className="text-sm text-gray-600">Social network analysis</div>
                                        </button>
                                        <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200 border border-gray-200">
                                            <div className="font-medium text-gray-800">BFS Traversal</div>
                                            <div className="text-sm text-gray-600">Breadth-first search</div>
                                        </button>
                                        <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200 border border-gray-200">
                                            <div className="font-medium text-gray-800">DFS Traversal</div>
                                            <div className="text-sm text-gray-600">Depth-first search</div>
                                        </button>
                                        <button className="w-full text-left p-3 bg-gray-50 hover:bg-yellow-100 rounded-lg transition-colors duration-200 border border-gray-200">
                                            <div className="font-medium text-gray-800">PageRank</div>
                                            <div className="text-sm text-gray-600">Node importance ranking</div>
                                        </button>
                                    </div>

                                    <div className="space-y-3 hidden">
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-sm text-gray-600">Nodes:</span>
                                            <span className="font-semibold text-gray-800">4</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-sm text-gray-600">Edges:</span>
                                            <span className="font-semibold text-gray-800">4</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-sm text-gray-600">Density:</span>
                                            <span className="font-semibold text-gray-800">0.67</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                            <span className="text-sm text-gray-600">Connected:</span>
                                            <span className="font-semibold text-green-600">Yes</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-sm text-gray-600">Avg. Degree:</span>
                                            <span className="font-semibold text-gray-800">2.0</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 hidden">
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-400 transition-colors duration-200">
                                            <span className="material-symbols-outlined text-3xl text-gray-400 mb-2 block">
                                                upload_file
                                            </span>
                                            <p className="text-sm text-gray-600">
                                                Drop GML file here or click to browse
                                            </p>
                                            <input type="file" accept=".gml" className="hidden" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-sm">
                                                <span className="material-symbols-outlined text-lg mb-1 block">
                                                    download
                                                </span>
                                                Export GML
                                            </button>
                                            <button className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md text-sm">
                                                <span className="material-symbols-outlined text-lg mb-1 block">
                                                    image
                                                </span>
                                                Export PNG
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Analysis Results</h2>
                                <div className="space-y-3">
                                    <details className="bg-gray-50 rounded-lg">
                                        <summary className="p-3 cursor-pointer hover:bg-yellow-50 transition-colors duration-200 rounded-lg">
                                            <span className="font-medium text-gray-800">
                                                Last Algorithm: Dijkstra's
                                            </span>
                                        </summary>
                                        <div className="p-3 pt-0">
                                            <div className="text-sm text-gray-600 space-y-1">
                                                <div>Path A → C: A → B → C (Cost: 8)</div>
                                                <div>Path A → D: A → D (Cost: 2)</div>
                                                <div>Execution Time: 0.003s</div>
                                            </div>
                                        </div>
                                    </details>

                                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <div className="text-sm text-gray-700">
                                            <div className="font-medium mb-1">Graph Status:</div>
                                            <div>✓ Connected graph</div>
                                            <div>✓ No self-loops detected</div>
                                            <div>⚠ Multiple edges found</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400 h-[600px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-800">Graph Canvas</h2>
                                    <div className="flex items-center space-x-2">
                                        <button className="p-2 bg-gray-100 hover:bg-yellow-100 rounded-full transition-colors duration-200">
                                            <span className="material-symbols-outlined">zoom_in</span>
                                        </button>
                                        <button className="p-2 bg-gray-100 hover:bg-yellow-100 rounded-full transition-colors duration-200">
                                            <span className="material-symbols-outlined">zoom_out</span>
                                        </button>
                                        <button className="p-2 bg-gray-100 hover:bg-yellow-100 rounded-full transition-colors duration-200">
                                            <span className="material-symbols-outlined">center_focus_weak</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="w-full h-[500px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden">
                                    "<CytoscapeComponent 
                                         elements={elements}     

                                        style={{ width: '100%', height: '100%' }}
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
                          "font-size": 12,
                          color: "#374151",
                          "text-background-color": "#ffffff",
                          "text-background-opacity": 1,
                          "text-background-padding": 2,
                        },
                      },
                    ]}
                    cy={(cy) => {
                      // click empty space to add a new node
                      cy.on("tap", (evt) => {
                        if (evt.target === cy) {
                          const id = `n${elements.length}`;
                          setElements((prev) => [
                            ...prev,
                            {
                              data: { id, label: id.toUpperCase() },
                              position: { x: evt.position.x, y: evt.position.y },
                            },
                          ]);
                        }
                      });

                      // click node to rename
                      cy.on("tap", "node", (evt) => {
                        const node = evt.target;
                        const newLabel = prompt(
                          "Enter new label:",
                          node.data("label")
                        );
                        if (newLabel) {
                          node.data("label", newLabel);
                        }
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
                                       

                                       

                                       


                                        

                              
                            <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-400">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Algorithm Explanation</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 hover:shadow-md transition-all duration-300">
                                        <h3 className="font-semibold text-gray-800 mb-2">Dijkstra's Algorithm</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Finds shortest paths from a source node to all other nodes in a weighted
                                            graph.
                                        </p>
                                        <div className="text-xs text-gray-500">Time Complexity: O((V + E) log V)</div>
                                    </div>

                                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 hover:shadow-md transition-all duration-300">
                                        <h3 className="font-semibold text-gray-800 mb-2">Structural Balance</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Analyzes social networks to determine stability based on positive and
                                            negative relationships.
                                        </p>
                                        <div className="text-xs text-gray-500">
                                            Application: Social network analysis
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 hover:shadow-md transition-all duration-300">
                                        <h3 className="font-semibold text-gray-800 mb-2">PageRank</h3>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Ranks nodes by importance based on the link structure of the graph.
                                        </p>
                                        <div className="text-xs text-gray-500">
                                            Time Complexity: O(V + E) per iteration
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    
    )
};
