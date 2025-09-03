import React from "react";

const GraphTools = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-400">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Graph Tools</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Graph Type</label>
          <select className="w-full p-3 border border-gray-300 rounded-lg">
            <option>Undirected</option>
            <option>Directed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Node Label</label>
          <input type="text" placeholder="Enter node label"
            className="w-full p-3 border border-gray-300 rounded-lg" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Edge Weight</label>
          <input type="number" placeholder="Enter weight"
            className="w-full p-3 border border-gray-300 rounded-lg" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button className="bg-yellow-400 hover:bg-yellow-500 text-white py-2 px-3 rounded-lg">
            Add Node
          </button>
          <button className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-3 rounded-lg">
            Add Edge
          </button>
        </div>

        <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg">
          Clear Graph
        </button>
      </div>
    </div>
  );
};

export default GraphTools;
