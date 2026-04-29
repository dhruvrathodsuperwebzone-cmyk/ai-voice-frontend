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
import { SpinnerDot } from '../PageLoader';

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

const shell = dashboardChartShell('border-l-amber-500');

export default function ConversionChart({ data, loading, title = 'Conversion rate' }) {
  const chartData = normalizeToRecharts(data);

  if (loading) {
    return (
      <div className={shell}>
        <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          <SpinnerDot className="border-amber-600" />
          <span>Loading…</span>
        </div>
        <div
          className="mt-auto w-full flex-1 animate-pulse rounded-xl bg-gradient-to-br from-amber-100/70 to-orange-50/40"
          style={{ minHeight: DASHBOARD_CHART_HEIGHT }}
        />
      </div>
    );
  }

  const avgRate = chartData.length
    ? chartData.reduce((sum, d) => sum + (d.rate || 0), 0) / chartData.length
    : 0;

  if (!chartData.length) {
    return (
      <div className={shell}>
        <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
        <p className="mb-3 text-xs text-slate-500">Hover on the chart to see %. Leads that convert will drive this metric.</p>
        <div
          className="mt-auto flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50/60 to-orange-50/25 text-sm text-slate-600"
          style={{ minHeight: DASHBOARD_CHART_HEIGHT }}
        >
          <span className="font-medium text-slate-700">No conversion data yet</span>
          <span className="text-center text-xs text-slate-500">Conversion rate will appear as leads convert</span>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <span className="whitespace-nowrap text-sm font-semibold text-amber-700">Avg {avgRate.toFixed(1)}%</span>
      </div>
      <p className="mb-2 text-xs text-slate-500">Hover on the chart to see %</p>
      <div className="mt-auto w-full flex-1" style={{ minHeight: DASHBOARD_CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height={DASHBOARD_CHART_HEIGHT}>
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="conversionGradDash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.38} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#fde68a" strokeOpacity={0.5} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#fde68a' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 'auto']} />
            <Tooltip
              formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Conversion']}
              contentStyle={{ borderRadius: 12, border: '1px solid #fde68a', boxShadow: '0 8px 24px rgba(180, 83, 9, 0.12)' }}
              labelStyle={{ color: '#334155', fontWeight: 600 }}
              itemStyle={{ color: '#d97706' }}
              cursor={{ stroke: '#fcd34d', strokeWidth: 1 }}
            />
            <Area type="monotone" dataKey="rate" name="Conversion %" stroke="#d97706" strokeWidth={2.5} fill="url(#conversionGradDash)" strokeLinecap="round" strokeLinejoin="round" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
