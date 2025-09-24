import React, { useState, useRef } from "react";
import GraphCanvas from "./GraphCanvas";
import GraphTools from "./GraphTools";
import AlgorithmPanel from "./Algorithm";
import AnalysisResults from "./Result";
import "../Pages/style.css";
//import AlgorithmExplanation from "./AlgorithmExplanation";

const Component = () => {
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

  const cyRef = useRef(null);

  return (
    <div id="webcrumbs">
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-amber-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="bg-white rounded-xl shadow-lg p-6 mb-6 border-l-4 border-yellow-400">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Graph Algorithm Analyzer
                </h1>
                <p className="text-gray-600">
                  Interactive tool for understanding networking algorithms
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-md">
                  Save Graph
                </button>
                <button className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg shadow-md">
                  Load GML
                </button>
              </div>
            </div>
          </header>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <GraphTools />
              <AlgorithmPanel cyRef={cyRef} />

            </div>

            <div className="lg:col-span-3">
              <GraphCanvas
                elements={elements}
                setElements={setElements}
                cyRef={cyRef}
              />
              <div className="mt-6">
                <AnalysisResults />
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Component;
