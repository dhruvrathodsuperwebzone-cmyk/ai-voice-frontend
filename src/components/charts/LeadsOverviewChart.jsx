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
import { SpinnerDot } from '../PageLoader';

function normalizePeriodSeries(data) {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const name = item?.label ?? item?.period ?? item?.day ?? item?.date ?? item?.name ?? '';
    const value = Number(item?.value ?? item?.leads ?? item?.count ?? item?.total ?? 0) || 0;
    return { name: name || '—', leads: value };
  });
}

function buildSnapshotRows(stats) {
  if (!stats || typeof stats !== 'object') return [];
  const total =
    stats.totalLeads ?? stats.total_leads ?? stats.leads ?? stats.leadCount ?? stats.lead_count;
  const assigned = stats.assigned_leads ?? stats.assignedLeads;
  const meetings = stats.meetings ?? stats.total_meetings ?? stats.totalMeetings;
  const rows = [];
  if (total != null) rows.push({ name: 'Total leads', leads: Number(total) || 0 });
  if (assigned != null) rows.push({ name: 'Assigned', leads: Number(assigned) || 0 });
  if (meetings != null) rows.push({ name: 'Meetings', leads: Number(meetings) || 0 });
  return rows;
}

const shell = dashboardChartShell('border-l-emerald-500');

export default function LeadsOverviewChart({ stats, loading, title = 'Leads & pipeline' }) {
  const periodSeries = normalizePeriodSeries(stats?.leadsByPeriod ?? stats?.leads_by_period);
  const snapshot = buildSnapshotRows(stats);
  const chartData = periodSeries.length ? periodSeries : snapshot;

  if (loading) {
    return (
      <div className={shell}>
        <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
          <SpinnerDot className="border-emerald-600" />
          <span>Loading…</span>
        </div>
        <div
          className="mt-auto w-full flex-1 animate-pulse rounded-xl bg-gradient-to-br from-emerald-100/70 to-teal-100/45"
          style={{ minHeight: DASHBOARD_CHART_HEIGHT }}
        />
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className={shell}>
        <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
        <p className="mb-3 text-xs text-slate-500">Leads, assignments, and meetings at a glance.</p>
        <div
          className="mt-auto flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50/60 to-teal-50/25 text-sm text-slate-600"
          style={{ minHeight: DASHBOARD_CHART_HEIGHT }}
        >
          <span className="font-medium text-slate-700">No pipeline data yet</span>
          <span className="text-center text-xs text-slate-500">Import leads and run campaigns to populate this chart</span>
        </div>
      </div>
    );
  }

  const periodSum = chartData.reduce((sum, d) => sum + (d.leads || 0), 0);
  const snapshotLeadTotal =
    stats?.totalLeads ?? stats?.total_leads ?? stats?.leads ?? stats?.leadCount ?? stats?.lead_count;
  const headline =
    periodSeries.length > 0
      ? `${periodSum.toLocaleString()} in view`
      : snapshotLeadTotal != null
        ? `${Number(snapshotLeadTotal).toLocaleString()} leads`
        : null;

  return (
    <div className={shell}>
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        {headline != null ? (
          <span className="whitespace-nowrap text-sm font-semibold text-emerald-700">{headline}</span>
        ) : null}
      </div>
      <p className="mb-2 text-xs text-slate-500">Hover on bars for counts</p>
      <div className="mt-auto w-full flex-1" style={{ minHeight: DASHBOARD_CHART_HEIGHT }}>
        <ResponsiveContainer width="100%" height={DASHBOARD_CHART_HEIGHT}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="leadsOverviewGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#059669" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#14b8a6" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#a7f3d0" strokeOpacity={0.45} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#a7f3d0' }}
              tickLine={false}
              interval={0}
              angle={chartData.length > 4 ? -20 : 0}
              textAnchor={chartData.length > 4 ? 'end' : 'middle'}
              height={chartData.length > 4 ? 52 : undefined}
            />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [Number(value).toLocaleString(), 'Count']}
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #a7f3d0',
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.12)',
              }}
              labelStyle={{ color: '#334155', fontWeight: 600 }}
              itemStyle={{ color: '#059669' }}
              cursor={{ fill: '#ecfdf5', radius: 4 }}
            />
            <Bar dataKey="leads" name="Leads" fill="url(#leadsOverviewGrad)" radius={[8, 8, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
