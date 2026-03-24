import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { dashboardChartShell, DASHBOARD_CHART_HEIGHT } from '../../constants/dashboardTheme';

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

const shell = dashboardChartShell('border-l-indigo-500');

export default function CallsChart({ data, loading, title = 'Calls per month' }) {
  const chartData = normalizeToRecharts(data);

  if (loading) {
    return (
      <div className={shell}>
        <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
        <p className="mb-3 text-xs text-slate-500">Loading…</p>
        <div
          className="mt-auto w-full flex-1 animate-pulse rounded-xl bg-gradient-to-br from-indigo-100/80 to-violet-100/50"
          style={{ minHeight: DASHBOARD_CHART_HEIGHT }}
        />
      </div>
    );
  }

  const totalCalls = chartData.reduce((sum, d) => sum + (d.calls || 0), 0);

  if (!chartData.length) {
    return (
      <div className={shell}>
        <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
        <p className="mb-3 text-xs text-slate-500">Hover on bars to see counts. Call data will appear as campaigns run.</p>
        <div
          className="mt-auto flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50/70 to-violet-50/30 text-sm text-slate-600"
          style={{ minHeight: DASHBOARD_CHART_HEIGHT }}
        >
          <span className="font-medium text-slate-700">No calls data yet</span>
          <span className="text-center text-xs text-slate-500">Calls from your campaigns will show here</span>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <span className="whitespace-nowrap text-sm font-semibold text-indigo-600">{totalCalls.toLocaleString()} calls</span>
      </div>
      <p className="mb-2 text-xs text-slate-500">Hover on bars to see counts</p>
      <div className="mt-auto w-full flex-1" style={{ minHeight: DASHBOARD_CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height={DASHBOARD_CHART_HEIGHT}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="callsGradDash" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#c7d2fe" strokeOpacity={0.45} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#c7d2fe' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [Number(value).toLocaleString(), 'Calls']}
              contentStyle={{ borderRadius: 12, border: '1px solid #c7d2fe', boxShadow: '0 8px 24px rgba(67, 56, 202, 0.12)' }}
              labelStyle={{ color: '#334155', fontWeight: 600 }}
              itemStyle={{ color: '#4f46e5' }}
              cursor={{ fill: '#eef2ff', radius: 4 }}
            />
            <Bar dataKey="calls" name="Calls" fill="url(#callsGradDash)" radius={[8, 8, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
