import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { getPredictionById, deletePrediction } from "../services/predictions";
import RiskGauge from "../components/RiskGauge";
import LoadingSpinner from "../components/LoadingSpinner";
import toast from "react-hot-toast";

// Human-readable labels for input features
const FEATURE_LABELS = {
  age:      "Age",
  sex:      "Sex",
  cp:       "Chest Pain",
  trestbps: "Blood Pressure",
  chol:     "Cholesterol",
  fbs:      "Fasting BS",
  restecg:  "Resting ECG",
  thalach:  "Max Heart Rate",
  exang:    "Exercise Angina",
  oldpeak:  "ST Depression",
  slope:    "ST Slope",
  ca:       "Major Vessels",
  thal:     "Thalassemia",
};

// Normalise values to 0-100 for radar chart display
const FEATURE_MAX = {
  age: 100, sex: 1, cp: 3, trestbps: 200, chol: 500,
  fbs: 1, restecg: 2, thalach: 200, exang: 1,
  oldpeak: 6, slope: 2, ca: 4, thal: 3,
};

export default function PredictionDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [pred,    setPred]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPredictionById(id)
      .then(({ data }) => setPred(data.prediction))
      .catch(() => toast.error("Prediction not found."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this prediction?")) return;
    try {
      await deletePrediction(id);
      toast.success("Deleted.");
      navigate("/history");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;
  if (!pred)   return <p className="text-center text-gray-400 mt-20">Prediction not found.</p>;

  const { result: r, inputData, createdAt, notes } = pred;

  // Build radar data
  const radarData = Object.entries(inputData).map(([key, val]) => ({
    feature: FEATURE_LABELS[key] || key,
    value:   Math.round((val / (FEATURE_MAX[key] || 1)) * 100),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/history"
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back to History
        </Link>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-primary-400 transition-colors"
        >
          <Trash2 size={15} /> Delete
        </button>
      </div>

      <h1 className="text-2xl font-bold text-white">Prediction Details</h1>
      <p className="text-gray-500 text-sm -mt-4">
        {new Date(createdAt).toLocaleString("en-GB", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        })}
      </p>

      {/* Result + gauge */}
      <div className="card flex flex-col sm:flex-row items-center gap-8">
        <RiskGauge probability={r.probability} riskLevel={r.risk_level} />
        <div className="space-y-3 text-center sm:text-left">
          <div className={`text-2xl font-bold ${r.prediction === 1 ? "text-primary-400" : "text-green-400"}`}>
            {r.prediction === 1 ? "⚠ Heart Disease Detected" : "✓ No Heart Disease Detected"}
          </div>
          <div className="text-gray-400 text-sm space-y-1">
            <p>Probability: <span className="text-white font-medium">{Math.round(r.probability * 100)}%</span></p>
            <p>Confidence:  <span className="text-white font-medium">{Math.round(r.confidence  * 100)}%</span></p>
            <p>Risk Level:  <span className="text-white font-medium">{r.risk_level}</span></p>
          </div>
          {notes && (
            <p className="text-gray-500 text-sm italic border-t border-gray-800 pt-3">
              Notes: {notes}
            </p>
          )}
        </div>
      </div>

      {/* Radar chart */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-300 mb-4">Feature Profile (normalised)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={100}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="feature" tick={{ fill: "#9ca3af", fontSize: 11 }} />
            <Radar
              name="Patient"
              dataKey="value"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Input data table */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-300 mb-4">Clinical Input Data</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(inputData).map(([key, val]) => (
            <div key={key} className="bg-gray-800 rounded-lg px-3 py-2.5">
              <p className="text-gray-500 text-xs uppercase tracking-wide">{FEATURE_LABELS[key] || key}</p>
              <p className="text-white font-semibold mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
