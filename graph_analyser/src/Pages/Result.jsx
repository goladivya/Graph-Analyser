import React from "react";

const AnalysisResults = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Analysis Results</h2>
      <div className="space-y-3">
        <details className="bg-gray-50 rounded-lg">
          <summary className="p-3 cursor-pointer hover:bg-yellow-50 rounded-lg">
            <span className="font-medium text-gray-800">Last Algorithm: Dijkstra's</span>
          </summary>
          <div className="p-3 pt-0 text-sm text-gray-600">
            <div>Path A → C: A → B → C (Cost: 8)</div>
            <div>Path A → D: A → D (Cost: 2)</div>
            <div>Execution Time: 0.003s</div>
          </div>
        </details>

        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-gray-700">
          <div className="font-medium mb-1">Graph Status:</div>
          <div>✓ Connected graph</div>
          <div>✓ No self-loops detected</div>
          <div>⚠ Multiple edges found</div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
