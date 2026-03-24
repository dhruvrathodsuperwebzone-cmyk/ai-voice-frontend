import { useEffect, useState } from 'react';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import {
  getDashboardStats,
  getRecentCalls,
  getRevenue,
} from '../services/dashboardService';
import StatsCards from '../components/StatsCards';
import RecentCallsTable from '../components/RecentCallsTable';
import RevenueChart from '../components/charts/RevenueChart';
import CallsChart from '../components/charts/CallsChart';
import ConversionChart from '../components/charts/ConversionChart';
import { dashboardChartsGridClass } from '../constants/dashboardTheme';

export default function DashboardPage() {
  const { user } = useAuth();
  const role = getRole(user);
  const [stats, setStats] = useState(null);
  const [recentCalls, setRecentCalls] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [callsLoading, setCallsLoading] = useState(true);
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
    getRecentCalls()
      .then((data) => { if (!cancelled) setRecentCalls(data); })
      .catch(() => { if (!cancelled) setRecentCalls([]); })
      .finally(() => { if (!cancelled) setCallsLoading(false); });
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

  const statsForCards = stats && totalRevenueFromApi != null ? { ...stats, revenue: totalRevenueFromApi } : stats;

  const callsSeries = Array.isArray(stats?.callsByPeriod) ? stats.callsByPeriod : (stats?.calls_by_period ?? []);
  const recentCount = Array.isArray(recentCalls) ? recentCalls.length : (recentCalls?.calls?.length ?? recentCalls?.recent?.length ?? 0);
  let callsChartData = callsSeries.length ? callsSeries : (recentCount ? [{ label: 'Recent', value: recentCount }] : []);
  if (callsChartData.length === 0 && stats != null && typeof (stats.calls_made ?? stats.total_calls) === 'number') {
    callsChartData = [{ name: 'Total', calls: stats.calls_made ?? stats.total_calls }];
  }

  const conversionSeries = Array.isArray(stats?.conversionByPeriod) ? stats.conversionByPeriod : (stats?.conversion_by_period ?? []);
  const singleConversion = stats && (stats.conversionRate != null || stats.conversion_rate != null);
  const conversionChartData = conversionSeries.length ? conversionSeries : (singleConversion ? [{ label: 'Rate', value: stats.conversionRate ?? stats.conversion_rate }] : []);

  const isViewer = role === 'viewer';
  const isAgent = role === 'agent';

  // Agent dashboard: simplified stats (Calls handled, Assigned leads, basic)
  if (isAgent) {
    const agentStats = {
      ...statsForCards,
      totalCalls: statsForCards?.calls_made ?? statsForCards?.total_calls ?? statsForCards?.totalCalls ?? 0,
      assignedLeads: statsForCards?.assigned_leads ?? statsForCards?.assignedLeads ?? 0,
      conversion_rate: statsForCards?.conversion_rate ?? statsForCards?.conversionRate ?? 0,
    };
    return (
      <div className="space-y-8">
        <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/35 to-indigo-50/25 px-5 py-6 shadow-sm shadow-indigo-950/[0.04] ring-1 ring-violet-100/40 sm:px-6 sm:py-7">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-8 left-1/4 h-24 w-48 rounded-full bg-indigo-400/10 blur-2xl" aria-hidden />
          <h1 className="relative text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <span className=" bg-clip-text text-transparent">
              Dashboard
            </span>
          </h1>
          <p className="relative mt-1.5 text-sm text-slate-600">Calls handled and assigned leads.</p>
        </header>
        <StatsCards stats={agentStats} loading={statsLoading} variant="agent" />
        <RecentCallsTable data={recentCalls} loading={callsLoading} />
      </div>
    );
  }

  // Viewer & Admin: full dashboard (Viewer = read-only, no buttons; Admin = same, campaigns etc. elsewhere)
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

      <RecentCallsTable data={recentCalls} loading={callsLoading} />
    </div>
  );
}
