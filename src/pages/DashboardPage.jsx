import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineCalendar,
  HiOutlineClipboardDocumentList,
  HiOutlineCpuChip,
  HiOutlineCreditCard,
  HiOutlinePhone,
  HiOutlineUserGroup,
} from 'react-icons/hi2';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import { getDashboardStats, getRevenue } from '../services/dashboardService';
import StatsCards from '../components/StatsCards';
import RevenueChart from '../components/charts/RevenueChart';
import CallsChart from '../components/charts/CallsChart';
import ConversionChart from '../components/charts/ConversionChart';
import { dashboardChartsGridClass } from '../constants/dashboardTheme';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = getRole(user);
  const isViewer = role === 'viewer';
  const isAgent = role === 'agent';

  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [revenueLoading, setRevenueLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDashboardStats()
      .then((res) => {
        if (cancelled) return;
        setStats(res?.data ?? res);
      })
      .catch(() => { if (!cancelled) setStats({}); })
      .finally(() => { if (!cancelled) setStatsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getRevenue()
      .then((data) => { if (!cancelled) setRevenue(data); })
      .catch(() => { if (!cancelled) setRevenue([]); })
      .finally(() => { if (!cancelled) setRevenueLoading(false); });
    return () => { cancelled = true; };
  }, []);

  let revenueSeries = [];
  let totalRevenueFromApi = null;
  if (Array.isArray(revenue)) revenueSeries = revenue;
  else if (revenue != null && typeof revenue === 'object') {
    const transactions = revenue?.recent_transactions ?? revenue?.transactions;
    if (Array.isArray(transactions) && transactions.length) {
      revenueSeries = transactions.map((tx, i) => ({
        label: tx.reference ?? tx.id?.toString() ?? `#${i + 1}`,
        value: Number(tx.amount) || 0,
      }));
      totalRevenueFromApi = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
    } else {
      const arr = revenue?.data ?? revenue?.series ?? revenue?.revenue;
      if (Array.isArray(arr)) revenueSeries = arr;
      else if (typeof (revenue?.revenue ?? revenue?.total ?? revenue?.amount) === 'number')
        revenueSeries = [{ label: 'Revenue', value: revenue.revenue ?? revenue.total ?? revenue.amount }];
    }
  } else if (typeof revenue === 'number') revenueSeries = [{ label: 'Revenue', value: revenue }];
  if (revenueSeries.length === 0 && stats != null && typeof (stats.revenue ?? stats.total_revenue) === 'number') {
    revenueSeries = [{ name: 'Total', revenue: stats.revenue ?? stats.total_revenue }];
  }

  /** Single number for stat cards when API returns series but no transaction sum */
  let revenueTotalForCards = totalRevenueFromApi;
  if (revenueTotalForCards == null && revenueSeries.length > 0) {
    revenueTotalForCards = revenueSeries.reduce(
      (s, d) => s + (Number(d.value ?? d.revenue ?? d.amount ?? d.total) || 0),
      0,
    );
  }
  if (revenueTotalForCards == null && stats != null) {
    const r = stats.revenue ?? stats.total_revenue ?? stats.totalRevenue;
    if (typeof r === 'number') revenueTotalForCards = r;
  }
  const revenueTotalNumeric = Number(revenueTotalForCards);
  const revenueTotalSafe = Number.isFinite(revenueTotalNumeric) ? revenueTotalNumeric : 0;

  const statsForCards = stats != null ? { ...stats, revenue: revenueTotalSafe } : stats;

  const callsSeries = Array.isArray(stats?.callsByPeriod) ? stats.callsByPeriod : (stats?.calls_by_period ?? []);
  let callsChartData = callsSeries.length ? callsSeries : [];
  if (callsChartData.length === 0 && stats != null && typeof (stats.calls_made ?? stats.total_calls) === 'number') {
    callsChartData = [{ name: 'Total', calls: stats.calls_made ?? stats.total_calls }];
  }

  const conversionSeries = Array.isArray(stats?.conversionByPeriod) ? stats.conversionByPeriod : (stats?.conversion_by_period ?? []);
  const singleConversion = stats && (stats.conversionRate != null || stats.conversion_rate != null);
  const conversionChartData = conversionSeries.length ? conversionSeries : (singleConversion ? [{ label: 'Rate', value: stats.conversionRate ?? stats.conversion_rate }] : []);

  // Agent dashboard: calls, revenue (from /revenue + stats), conversion
  if (isAgent) {
    const agentStats = {
      ...statsForCards,
      totalCalls: statsForCards?.calls_made ?? statsForCards?.total_calls ?? statsForCards?.totalCalls ?? 0,
      revenue: revenueTotalSafe,
      conversion_rate: statsForCards?.conversion_rate ?? statsForCards?.conversionRate ?? 0,
    };
    const agentShortcuts = [
      { to: '/dashboard/calls', label: 'Calls', desc: 'Recordings & history', Icon: HiOutlinePhone },
      { to: '/dashboard/leads', label: 'Leads', desc: 'Pipeline & contacts', Icon: HiOutlineUserGroup },
      { to: '/dashboard/all-log', label: 'Call log', desc: 'Full activity', Icon: HiOutlineClipboardDocumentList },
      { to: '/dashboard/calendar', label: 'Calendar', desc: 'Schedule', Icon: HiOutlineCalendar },
      { to: '/dashboard/payments', label: 'Payments', desc: 'Earnings', Icon: HiOutlineCreditCard },
      { to: '/dashboard/agents', label: 'Agents', desc: 'Your AI agents', Icon: HiOutlineCpuChip },
    ];

    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>

        <StatsCards stats={agentStats} loading={statsLoading || revenueLoading} variant="agent" />

        <section className="space-y-3 sm:space-y-4" aria-labelledby="agent-shortcuts-heading">
          <h2 id="agent-shortcuts-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-800/90">
            Shortcuts
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {agentShortcuts.map(({ to, label, desc, Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex flex-col gap-2 rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-white to-violet-50/30 p-4 shadow-sm shadow-indigo-950/[0.04] ring-1 ring-violet-100/35 transition-[box-shadow,transform,border-color] hover:-translate-y-0.5 hover:border-violet-300/60 hover:shadow-md hover:shadow-indigo-950/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 sm:p-4"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-900/20 ring-2 ring-white">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-slate-900">{label}</span>
                <span className="text-xs leading-snug text-slate-500 group-hover:text-slate-600">{desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3 sm:space-y-4" aria-labelledby="agent-charts-heading">
          <h2 id="agent-charts-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-800/90">
            Performance charts
          </h2>
          <div className={dashboardChartsGridClass}>
            <RevenueChart data={revenueSeries} loading={revenueLoading} title="Your revenue" />
            <CallsChart data={callsChartData} loading={statsLoading} title="Calls over time" />
            <ConversionChart data={conversionChartData} loading={statsLoading} title="Conversion rate" />
          </div>
        </section>
      </div>
    );
  }

  // Viewer & Admin: stats + charts (no recent-calls table; use Call Log for call lists)
  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/35 to-indigo-50/25 px-5 py-6 shadow-sm shadow-indigo-950/[0.04] ring-1 ring-violet-100/40 sm:px-6 sm:py-7">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-8 left-1/4 h-24 w-48 rounded-full bg-indigo-400/10 blur-2xl" aria-hidden />
        <h1 className="relative text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <span className="bg-black bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
        <p className="relative mt-1.5 text-sm text-slate-600">
          {isViewer ? 'Overview of AI voice agent activity. Read-only.' : 'Overview of your AI voice agent activity.'}
        </p>
      </header>

      <StatsCards stats={statsForCards} loading={statsLoading} />

      <section className="space-y-3 sm:space-y-4" aria-labelledby="dash-charts-heading">
        <h2 id="dash-charts-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-800/90">
          Performance charts
        </h2>
        <div className={dashboardChartsGridClass}>
          <RevenueChart data={revenueSeries} loading={revenueLoading} title="Revenue per month" />
          <CallsChart data={callsChartData} loading={statsLoading} title="Calls per month" />
          <ConversionChart data={conversionChartData} loading={statsLoading} title="Conversion rate" />
        </div>
      </section>

    </div>
  );
}
