import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function normalizeToRecharts(data) {
  if (!Array.isArray(data)) {
    const d = data?.data ?? data?.calls ?? data?.series ?? [];
    if (!Array.isArray(d)) return [];
    data = d;
  }
  return data.map((item) => {
    const name = item?.label ?? item?.period ?? item?.day ?? item?.date ?? item?.name ?? '';
    const value = Number(item?.value ?? item?.calls ?? item?.count ?? item?.total ?? 0) || 0;
    return { name: name || '—', calls: value };
  });
}

const chartCardClass = 'bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/30 p-6';

export default function CallsChart({ data, loading, title = 'Calls per month' }) {
  const chartData = normalizeToRecharts(data);

  if (loading) {
    return (
      <div className={chartCardClass}>
        <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-400 text-xs mb-4">Loading…</p>
        <div className="h-64 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 animate-pulse" />
      </div>
    );
  }

  const totalCalls = chartData.reduce((sum, d) => sum + (d.calls || 0), 0);

  if (!chartData.length) {
    return (
      <div className={chartCardClass}>
        <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-400 text-xs mb-4">Hover on bars to see counts. Call data will appear as campaigns run.</p>
        <div className="h-64 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
          <span>No calls data yet</span>
          <span className="text-xs">Calls from your campaigns will show here</span>
        </div>
      </div>
    );
  }

  return (
    <div className={chartCardClass}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <span className="text-sm font-semibold text-teal-600 whitespace-nowrap">{totalCalls.toLocaleString()} calls</span>
      </div>
      <p className="text-slate-400 text-xs mb-4">Hover on bars to see counts</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="callsGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#0d9488" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [Number(value).toLocaleString(), 'Calls']}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            labelStyle={{ color: '#334155', fontWeight: 600 }}
            itemStyle={{ color: '#0d9488' }}
            cursor={{ fill: '#f0fdfa', radius: 4 }}
          />
          <Bar dataKey="calls" name="Calls" fill="url(#callsGrad)" radius={[8, 8, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
