import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Activity, Heart, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { getStats, getPredictions } from "../services/predictions";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";

const RISK_COLORS = { Low: "#22c55e", Moderate: "#f59e0b", High: "#ef4444" };

export default function DashboardPage() {
  const { user }  = useAuth();
  const [stats,   setStats]   = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, predsRes] = await Promise.all([
          getStats(),
          getPredictions({ limit: 7, page: 1 }),
        ]);
        setStats(statsRes.data.stats);
        setRecent(predsRes.data.predictions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="mt-20" />;

  // Pie chart data for risk distribution
  const pieData = stats
    ? [
        { name: "Low",      value: stats.lowRiskCount   },
        { name: "Moderate", value: stats.moderateCount  },
        { name: "High",     value: stats.highRiskCount  },
      ].filter((d) => d.value > 0)
    : [];

  // Bar chart data from recent predictions
  const barData = recent.map((p, i) => ({
    name:  `#${recent.length - i}`,
    risk:  Math.round(p.result.probability * 100),
    label: p.result.risk_level,
  }));

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-400 mt-1">Here&apos;s your heart health overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Predictions"
          value={stats?.total ?? 0}
          icon={Activity}
          color="text-blue-400"
        />
        <StatCard
          title="Disease Detected"
          value={stats?.diseaseCount ?? 0}
          subtitle={stats?.total ? `${Math.round((stats.diseaseCount / stats.total) * 100)}% of total` : ""}
          icon={Heart}
          color="text-primary-400"
        />
        <StatCard
          title="High Risk"
          value={stats?.highRiskCount ?? 0}
          icon={AlertTriangle}
          color="text-red-400"
        />
        <StatCard
          title="Avg. Risk Score"
          value={stats?.avgProbability ? `${Math.round(stats.avgProbability * 100)}%` : "—"}
          icon={TrendingUp}
          color="text-yellow-400"
        />
      </div>

      {/* Charts */}
      {stats?.total > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Risk Scores</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 12 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                  labelStyle={{ color: "#f9fafb" }}
                  formatter={(v, _, props) => [`${v}% (${props.payload.label})`, "Risk"]}
                />
                <Bar dataKey="risk" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.label] || "#6b7280"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#6b7280" }}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ color: "#9ca3af" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="card text-center py-16">
          <CheckCircle className="mx-auto text-gray-600 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-300">No predictions yet</h2>
          <p className="text-gray-500 mt-2 mb-6">
            Run your first heart disease risk assessment to see your dashboard.
          </p>
          <Link to="/predict" className="btn-primary inline-flex items-center gap-2">
            <Activity size={16} /> Start Prediction
          </Link>
        </div>
      )}
    </div>
  );
}
