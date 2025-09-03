import React from "react";

const AlgorithmPanel = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="flex border-b border-gray-200">
        <button className="flex-1 py-3 px-4 font-medium text-gray-700 border-b-2 border-yellow-400">
          Algorithms
        </button>
        <button className="flex-1 py-3 px-4 font-medium text-gray-700">
          Properties
        </button>
        <button className="flex-1 py-3 px-4 font-medium text-gray-700">
          Import/Export
        </button>
      </div>

      <div className="p-4 space-y-2">
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
      </div>
    </div>
  );
};

export default AlgorithmPanel;
