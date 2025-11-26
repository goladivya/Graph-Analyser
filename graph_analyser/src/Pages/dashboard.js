import React, { useState, useRef, useEffect } from "react";
import GraphCanvas from "./GraphCanvas";
import GraphTools from "./GraphTools";
import AlgorithmPanel from "./Algorithm";
import AnalysisResults from "./Result";
import "../Pages/style.css";

const MAX_HISTORY = 100;

const Component = () => {
  const [elements, setElements] = useState([
    { data: { id: "A", label: "A" }, position: { x: 150, y: 100 } },
    { data: { id: "B", label: "B" }, position: { x: 300, y: 150 } },
    { data: { id: "C", label: "C" }, position: { x: 450, y: 100 } },
    { data: { id: "D", label: "D" }, position: { x: 300, y: 280 } },
    { data: { id: "AB", source: "A", target: "B", weight: 5, directed: false } },
    { data: { id: "BC", source: "B", target: "C", weight: 3, directed: false } },
    { data: { id: "BD", source: "B", target: "D", weight: 7, directed: false } },
    { data: { id: "AD", source: "A", target: "D", weight: 2, directed: false } },
  ]);

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [nodeCounter, setNodeCounter] = useState(1);
  const [results, setResults] = useState(null);
  const cyRef = useRef(null);

  const deepCopy = (obj) =>
    typeof structuredClone === "function"
      ? structuredClone(obj)
      : JSON.parse(JSON.stringify(obj));

  const updateElements = (nextOrUpdater) => {
    setElements((prevElements) => {
      setHistory((h) => {
        const newHistory = [...h, deepCopy(prevElements)];
        if (newHistory.length > MAX_HISTORY) newHistory.shift();
        return newHistory;
      });

      setRedoStack([]);

      const nextElements =
        typeof nextOrUpdater === "function"
          ? nextOrUpdater(prevElements)
          : nextOrUpdater;

      return deepCopy(nextElements);
    });
  };

  /* const addNode = () => {
     const newId = `N${nodeCounter}`;
     const newNode = {
       data: { id: newId, label: newId },
       position: { x: 200 + nodeCounter * 30, y: 200 },
     };
     updateElements((prev) => [...prev, newNode]);
     setNodeCounter((c) => c + 1);
   };*/

  const clearGraph = () => {
    updateElements([]);
    setNodeCounter(1);
  };

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prevState = h[h.length - 1];

      setRedoStack((r) => [...r, deepCopy(elements)]);
      setElements(deepCopy(prevState));

      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      const nextState = r[r.length - 1];

      setHistory((h) => [...h, deepCopy(elements)]);
      setElements(deepCopy(nextState));

      return r.slice(0, -1);
    });
  };




  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    //Structural

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [elements]);


  //Save 
  const saveGraph = () => {
    // Convert the elements array to JSON
    const dataStr = JSON.stringify(elements, null, 2); // pretty print
    const blob = new Blob([dataStr], { type: "application/json" });

    // Create a temporary link to download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "graph.json";
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
  };

  //Gml
  const convertToGML = (elements) => {
    let gml = "graph [\n  directed 0\n";

    elements.forEach((el) => {
      if (el.data.source && el.data.target) {
        // Edge
        gml += `  edge [\n    source "${el.data.source}"\n    target "${el.data.target}"\n    weight ${el.data.weight || 1}\n  ]\n`;
      } else {
        // Node
        gml += `  node [\n    id "${el.data.id}"\n    label "${el.data.label}"\n    x ${el.position.x}\n    y ${el.position.y}\n  ]\n`;
      }
    });

    gml += "]";
    return gml;
  };

  const saveGraphGML = () => {
    const gmlData = convertToGML(elements);
    const blob = new Blob([gmlData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "graph.gml";
    a.click();

    URL.revokeObjectURL(url);
  };

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
                <button
                  onClick={undo}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-md"
                  disabled={history.length === 0}
                >
                  Undo
                </button>
                <button
                  onClick={redo}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg shadow-md"
                  disabled={redoStack.length === 0}
                >
                  Redo
                </button>
                {/*<button
                  onClick={addNode}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-md"
                >
                  Add Node
                </button>*/}
                <button
                  onClick={clearGraph}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-md"
                >
                  Clear Graph
                </button>

                <button
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg shadow-md"
                  onClick={saveGraph}
                >
                  Save Graph
                </button>

                <button
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg shadow-md"
                  onClick={saveGraphGML}
                >
                  Save GML
                </button>

              </div>
            </div>
          </header>

          {/* Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div
                // style top to match header height (adjust 112px -> your header height)
                style={{ position: "sticky", top: "112px", maxHeight: "calc(100vh - 112px)", overflowY: "auto", paddingRight: "8px" }}
                className="space-y-6"
              >
                <GraphTools setElements={updateElements} />
                <AlgorithmPanel cyRef={cyRef} setResults={setResults} />
              </div>
            </div>

            <div className="lg:col-span-3">
              <GraphCanvas
                elements={elements}
                setElements={updateElements}
                cyRef={cyRef}
              />
              <div className="mt-6">
                <AnalysisResults results={results} />
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Component;
