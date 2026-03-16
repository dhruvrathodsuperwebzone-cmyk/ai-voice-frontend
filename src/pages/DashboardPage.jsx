import { useEffect, useState } from 'react';
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

export default function DashboardPage() {
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
        // API returns { success, data: { calls_made, revenue, ... } } — use inner data for cards
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

  // Revenue chart: from GET /api/revenue (transactions/series) or fallback to stats.revenue
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

  // Calls chart: from stats time series, or recent count, or stats.calls_made
  const callsSeries = Array.isArray(stats?.callsByPeriod) ? stats.callsByPeriod : (stats?.calls_by_period ?? []);
  const recentCount = Array.isArray(recentCalls) ? recentCalls.length : (recentCalls?.calls?.length ?? recentCalls?.recent?.length ?? 0);
  let callsChartData = callsSeries.length ? callsSeries : (recentCount ? [{ label: 'Recent', value: recentCount }] : []);
  if (callsChartData.length === 0 && stats != null && typeof (stats.calls_made ?? stats.total_calls) === 'number') {
    callsChartData = [{ name: 'Total', calls: stats.calls_made ?? stats.total_calls }];
  }

  // Conversion chart: from stats time series or stats.conversion_rate
  const conversionSeries = Array.isArray(stats?.conversionByPeriod) ? stats.conversionByPeriod : (stats?.conversion_by_period ?? []);
  const singleConversion = stats && (stats.conversionRate != null || stats.conversion_rate != null);
  const conversionChartData = conversionSeries.length ? conversionSeries : (singleConversion ? [{ label: 'Rate', value: stats.conversionRate ?? stats.conversion_rate }] : []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Overview of your AI voice agent activity.</p>
      </div>

      <StatsCards stats={statsForCards} loading={statsLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <RevenueChart data={revenueSeries} loading={revenueLoading} title="Revenue per month" />
        <CallsChart data={callsChartData} loading={statsLoading} title="Calls per month" />
        <ConversionChart data={conversionChartData} loading={statsLoading} title="Conversion rate" />
      </div>

      <RecentCallsTable data={recentCalls} loading={callsLoading} />
    </div>
  );
}
