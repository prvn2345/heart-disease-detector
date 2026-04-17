export default function StatCard({ title, value, subtitle, icon: Icon, color = "text-primary-400" }) {
  return (
    <div className="card flex items-start gap-4">
      {Icon && (
        <div className={`p-3 rounded-lg bg-gray-800 ${color}`}>
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
