import React, { useState } from "react";

const GraphTools = ({ setElements }) => {
  const [nodeId, setNodeId] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [weight, setWeight] = useState("");
  const [directed, setDirected] = useState(false);
   // const [isUndirected, setIsUndirected] = useState(false);

  const handleAddNode = () => {
    if (!nodeId.trim()) return;
    setElements((prev) => [
      ...prev,
      {
        data: { id: nodeId.trim(), label: nodeId.trim() },
        position: { x: Math.random() * 500 + 50, y: Math.random() * 400 + 50 },
      },
    ]);
    setNodeId("");
  };

  const handleAddEdge = () => {
    if (!source.trim() || !target.trim()) return;
    const edgeId = `${source.trim()}-${target.trim()}`;
    setElements((prev) => [
      ...prev,
      {
        data: {
          id: edgeId,
          source: source.trim(),
          target: target.trim(),
          weight: weight ? parseFloat(weight) : 1,
          directed,
        },
      },
    ]);
    setSource("");
    setTarget("");
    setWeight("");
    setDirected(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-400">
      <h2 className="text-xl font-bold mb-3 text-gray-800">Graph Tools</h2>

      {/* Add Node */}
      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">Node</h3>
        <input
          type="text"
          placeholder="Node ID"
          value={nodeId}
          onChange={(e) => setNodeId(e.target.value)}
          className="border rounded-lg px-3 py-1 w-full mb-2"
        />
        <button
          onClick={handleAddNode}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg shadow-md w-full"
        >
          Add Node
        </button>
      </div>

      {/* Add Edge */}
      <div>
        <h3 className="text-md font-semibold mb-2">Edge</h3>
        <input
          type="text"
          placeholder="Source Node"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="border rounded-lg px-3 py-1 w-full mb-2"
        />
        <input
          type="text"
          placeholder="Target Node"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="border rounded-lg px-3 py-1 w-full mb-2"
        />
        <input
          type="number"
          placeholder="Weight (optional)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="border rounded-lg px-3 py-1 w-full mb-2"
        />

        {/* Directed or Undirected */}
        <label className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            checked={directed}
            onChange={(e) => setDirected(e.target.checked)}
          />
          <span>Directed Edge</span>
        </label>

        <button
          onClick={handleAddEdge}
          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg shadow-md w-full"
        >
          Add Edge
        </button>
      </div>
    </div>
  );
};

export default GraphTools;
