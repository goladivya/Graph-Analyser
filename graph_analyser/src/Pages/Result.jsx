import React from "react";

const AnalysisResults = ({ results }) => {
  if (!results) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Analysis Results</h2>
      <div className="space-y-3">

        {/* Generic Algorithm Summary (Excluded for HITS) */}
        {results.algorithm &&
         results.algorithm !== "HITS (Hubs & Authorities)" && (
          <details className="bg-gray-50 rounded-lg">
            <summary className="p-3 cursor-pointer hover:bg-yellow-50 rounded-lg">
              <span className="font-medium text-gray-800">
                Last Algorithm: {results.algorithm}
              </span>
            </summary>

            <div className="p-3 pt-0 text-sm text-gray-600">
              {results.paths &&
                results.paths.map((path, idx) => (
                  <div key={idx}>
                    {path.name}: {path.route} (Cost: {path.cost})
                  </div>
                ))}

              {results.executionTime && (
                <div>Execution Time: {results.executionTime}s</div>
              )}

              {results.balanced !== undefined && (
                <>
                  <div>Balanced: {results.balanced ? "Yes ✅" : "No ❌"}</div>
                  <div>Conflicts: {(results.conflicts || []).length}</div>
                </>
              )}
            </div>
          </details>
        )}

        {/* Graph Status */}
        {results.graphStatus && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-gray-700">
            <div className="font-medium mb-1">Graph Status:</div>
            {results.graphStatus.map((status, idx) => (
              <div key={idx}>{status}</div>
            ))}
          </div>
        )}

        {/* HITS Algorithm Results */}
        {results.hubs && results.authorities && (
          <details className="bg-gray-50 rounded-lg">
            <summary className="p-3 cursor-pointer hover:bg-yellow-50 rounded-lg">
              <span className="font-medium text-gray-800">
                HITS Algorithm Results
              </span>
            </summary>

            <div className="p-3 pt-0 text-sm text-gray-600">
              <div className="font-semibold">Hub Scores:</div>
              {Object.keys(results.hubs).map((n) => (
                <div key={n}>
                  {n}: {results.hubs[n].toFixed(4)}
                </div>
              ))}

              <div className="font-semibold mt-3">Authority Scores:</div>
              {Object.keys(results.authorities).map((n) => (
                <div key={n}>
                  {n}: {results.authorities[n].toFixed(4)}
                </div>
              ))}

              <div className="mt-3">Iterations: {results.iterations}</div>
            </div>
          </details>
        )}

      </div>
    </div>
  );
};

export default AnalysisResults;
