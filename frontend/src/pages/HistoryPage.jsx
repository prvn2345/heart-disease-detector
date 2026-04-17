import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Trash2, Eye, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { getPredictions, deletePrediction } from "../services/predictions";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

const RISK_BADGE = {
  Low:      "bg-green-900/50 text-green-400 border border-green-800",
  Moderate: "bg-yellow-900/50 text-yellow-400 border border-yellow-800",
  High:     "bg-red-900/50 text-red-400 border border-red-800",
};

export default function HistoryPage() {
  const [predictions, setPredictions] = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, pages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);

  const fetchPredictions = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await getPredictions({ page: p, limit: 10 });
      setPredictions(data.predictions);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPredictions(page); }, [page, fetchPredictions]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this prediction?")) return;
    try {
      await deletePrediction(id);
      toast.success("Prediction deleted.");
      fetchPredictions(page);
    } catch {
      toast.error("Failed to delete.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="text-primary-400" size={24} />
            Prediction History
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {pagination.total} total prediction{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/predict" className="btn-primary text-sm">
          + New Prediction
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="mt-16" />
      ) : predictions.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList className="mx-auto text-gray-600 mb-4" size={48} />
          <p className="text-gray-400">No predictions yet.</p>
          <Link to="/predict" className="btn-primary inline-block mt-4">
            Run First Prediction
          </Link>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="card overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Date</th>
                  <th className="text-left px-5 py-3">Result</th>
                  <th className="text-left px-5 py-3">Risk Level</th>
                  <th className="text-left px-5 py-3">Probability</th>
                  <th className="text-left px-5 py-3">Age / Sex</th>
                  <th className="text-right px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={p.result.prediction === 1 ? "text-primary-400 font-medium" : "text-green-400 font-medium"}>
                        {p.result.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${RISK_BADGE[p.result.risk_level]}`}>
                        {p.result.risk_level}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-300">
                      {Math.round(p.result.probability * 100)}%
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {p.inputData.age}y / {p.inputData.sex === 1 ? "M" : "F"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/history/${p._id}`}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                          aria-label="View details"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-gray-700 rounded-lg transition-colors"
                          aria-label="Delete prediction"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-3 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary py-1.5 px-3 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
