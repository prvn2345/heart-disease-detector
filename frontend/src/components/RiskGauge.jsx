/**
 * RiskGauge.jsx
 * Animated circular gauge showing risk probability.
 */

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const RISK_COLORS = {
  Low:      "#22c55e",
  Moderate: "#f59e0b",
  High:     "#ef4444",
};

export default function RiskGauge({ probability, riskLevel }) {
  const pct   = Math.round(probability * 100);
  const color = RISK_COLORS[riskLevel] || "#6b7280";

  // Two-segment donut: filled + remainder
  const data = [
    { value: pct },
    { value: 100 - pct },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill="#1f2937" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center mt-6">
          <span className="text-3xl font-bold" style={{ color }}>{pct}%</span>
          <span className="text-xs text-gray-400 mt-0.5">Risk</span>
        </div>
      </div>

      <span
        className="mt-2 text-lg font-semibold px-4 py-1 rounded-full"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {riskLevel} Risk
      </span>
    </div>
  );
}
