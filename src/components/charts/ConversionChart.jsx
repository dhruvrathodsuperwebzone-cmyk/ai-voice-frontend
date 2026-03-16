import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function normalizeToRecharts(data) {
  if (!Array.isArray(data)) {
    const d = data?.data ?? data?.conversion ?? data?.series ?? [];
    if (!Array.isArray(d)) return [];
    data = d;
  }
  return data.map((item) => {
    const name = item?.label ?? item?.period ?? item?.month ?? item?.date ?? item?.name ?? '';
    let value = Number(item?.value ?? item?.rate ?? item?.conversionRate ?? item?.conversion_rate ?? 0) || 0;
    if (value > 0 && value <= 1) value = value * 100;
    return { name: name || '—', rate: value };
  });
}

const chartCardClass = 'bg-white rounded-2xl border border-slate-200/80 shadow-lg shadow-slate-200/30 p-6';

export default function ConversionChart({ data, loading, title = 'Conversion rate' }) {
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

  const avgRate = chartData.length
    ? chartData.reduce((sum, d) => sum + (d.rate || 0), 0) / chartData.length
    : 0;

  if (!chartData.length) {
    return (
      <div className={chartCardClass}>
        <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-400 text-xs mb-4">Hover on the chart to see %. Leads that convert will drive this metric.</p>
        <div className="h-64 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm">
          <span>No conversion data yet</span>
          <span className="text-xs">Conversion rate will appear as leads convert</span>
        </div>
      </div>
    );
  }

  return (
    <div className={chartCardClass}>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <span className="text-sm font-semibold text-amber-600 whitespace-nowrap">Avg {avgRate.toFixed(1)}%</span>
      </div>
      <p className="text-slate-400 text-xs mb-4">Hover on the chart to see %</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="conversionGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 'auto']} />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Conversion']}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
            labelStyle={{ color: '#334155', fontWeight: 600 }}
            itemStyle={{ color: '#f59e0b' }}
            cursor={{ stroke: '#fde68a', strokeWidth: 1 }}
          />
          <Area type="monotone" dataKey="rate" name="Conversion %" stroke="#f59e0b" strokeWidth={2.5} fill="url(#conversionGrad)" strokeLinecap="round" strokeLinejoin="round" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
