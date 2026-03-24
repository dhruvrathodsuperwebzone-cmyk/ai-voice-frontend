import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { dashboardChartShell, DASHBOARD_CHART_HEIGHT } from '../../constants/dashboardTheme';

function normalizeToRecharts(data) {
  if (!Array.isArray(data)) {
    const transactions = data?.recent_transactions ?? data?.transactions;
    if (Array.isArray(transactions) && transactions.length) {
      return transactions.map((tx, i) => ({
        name: tx.reference ?? tx.id?.toString() ?? `#${i + 1}`,
        revenue: Number(tx.amount) || 0,
      }));
    }
    const d = data?.data ?? data?.revenue ?? data?.series ?? [];
    if (!Array.isArray(d)) return [];
    data = d;
  }
  return data.map((item) => {
    const name = item?.label ?? item?.period ?? item?.month ?? item?.date ?? item?.name ?? '';
    const value = Number(item?.value ?? item?.revenue ?? item?.amount ?? item?.total ?? 0) || 0;
    return { name: name || '—', revenue: value };
  });
}

const shell = dashboardChartShell('border-l-violet-500');

export default function RevenueChart({ data, loading, title = 'Revenue per month' }) {
  const chartData = normalizeToRecharts(data);

  if (loading) {
    return (
      <div className={shell}>
        <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
        <p className="mb-3 text-xs text-slate-500">Loading…</p>
        <div
          className="mt-auto w-full flex-1 animate-pulse rounded-xl bg-gradient-to-br from-violet-100/80 to-indigo-100/50"
          style={{ minHeight: DASHBOARD_CHART_HEIGHT }}
        />
      </div>
    );
  }

  const totalRevenue = chartData.reduce((sum, d) => sum + (d.revenue || 0), 0);

  if (!chartData.length) {
    return (
      <div className={shell}>
        <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
        <p className="mb-3 text-xs text-slate-500">Hover on the chart to see values. Add revenue data to see trends.</p>
        <div
          className="mt-auto flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-violet-200/50 bg-gradient-to-br from-violet-50/60 to-indigo-50/30 text-sm text-slate-600"
          style={{ minHeight: DASHBOARD_CHART_HEIGHT }}
        >
          <span className="font-medium text-slate-700">No revenue data yet</span>
          <span className="text-center text-xs text-slate-500">Revenue from payments will appear here</span>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <span className="whitespace-nowrap text-sm font-semibold text-violet-700">Total ₹{totalRevenue.toLocaleString()}</span>
      </div>
      <p className="mb-2 text-xs text-slate-500">Hover on the chart to see values</p>
      <div className="mt-auto w-full flex-1" style={{ minHeight: DASHBOARD_CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height={DASHBOARD_CHART_HEIGHT}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="revenueGradDash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.42} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.06} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9d5ff" strokeOpacity={0.35} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e9d5ff' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
            <Tooltip
              formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
              contentStyle={{ borderRadius: 12, border: '1px solid #ddd6fe', boxShadow: '0 8px 24px rgba(76, 29, 149, 0.12)' }}
              labelStyle={{ color: '#334155', fontWeight: 600 }}
              itemStyle={{ color: '#6d28d9' }}
              cursor={{ stroke: '#c4b5fd', strokeWidth: 1 }}
            />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6d28d9" strokeWidth={2.5} fill="url(#revenueGradDash)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
