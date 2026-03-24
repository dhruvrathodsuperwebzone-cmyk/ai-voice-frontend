import { useEffect, useState } from 'react';
import { getDashboardStats, getRevenue } from '../services/dashboardService';
import RevenueChart from '../components/charts/RevenueChart';
import CallsChart from '../components/charts/CallsChart';
import ConversionChart from '../components/charts/ConversionChart';
import LeadsOverviewChart from '../components/charts/LeadsOverviewChart';
import { dashboardChartsGridClass } from '../constants/dashboardTheme';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDashboardStats(), getRevenue()])
      .then(([statsRes, revenueData]) => {
        if (cancelled) return;
        setStats(statsRes?.data ?? statsRes);
        setRevenue(revenueData);
      })
      .catch(() => { if (!cancelled) setStats({}); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  let revenueSeries = [];
  if (Array.isArray(revenue)) revenueSeries = revenue;
  else if (revenue != null && typeof revenue === 'object') {
    const transactions = revenue?.recent_transactions ?? revenue?.transactions;
    if (Array.isArray(transactions) && transactions.length) {
      revenueSeries = transactions.map((tx, i) => ({
        label: tx.reference ?? tx.id?.toString() ?? `#${i + 1}`,
        value: Number(tx.amount) || 0,
      }));
    } else {
      const arr = revenue?.data ?? revenue?.series ?? revenue?.revenue;
      if (Array.isArray(arr)) revenueSeries = arr;
    }
  }
  if (revenueSeries.length === 0 && stats != null && typeof (stats.revenue ?? stats.total_revenue) === 'number') {
    revenueSeries = [{ name: 'Total', revenue: stats.revenue ?? stats.total_revenue }];
  }

  const callsSeries = Array.isArray(stats?.callsByPeriod) ? stats.callsByPeriod : (stats?.calls_by_period ?? []);
  let callsChartData = callsSeries.length ? callsSeries : [];
  if (callsChartData.length === 0 && stats != null && typeof (stats.calls_made ?? stats.total_calls) === 'number') {
    callsChartData = [{ name: 'Total', calls: stats.calls_made ?? stats.total_calls }];
  }

  const conversionSeries = Array.isArray(stats?.conversionByPeriod) ? stats.conversionByPeriod : (stats?.conversion_by_period ?? []);
  const singleConversion = stats && (stats.conversionRate != null || stats.conversion_rate != null);
  const conversionChartData = conversionSeries.length ? conversionSeries : (singleConversion ? [{ label: 'Rate', value: stats.conversionRate ?? stats.conversion_rate }] : []);

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/35 to-indigo-50/25 px-5 py-6 shadow-sm shadow-indigo-950/[0.04] ring-1 ring-violet-100/40 sm:px-6 sm:py-7">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-8 left-1/4 h-24 w-48 rounded-full bg-indigo-400/10 blur-2xl" aria-hidden />
        <h1 className="relative text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          <span className="bg-black bg-clip-text text-transparent">
            Analytics
          </span>
        </h1>
        <p className="relative mt-1.5 text-sm text-slate-600">
          Revenue, calls, conversion, and pipeline. Read-only.
        </p>
      </header>

      <section className="space-y-3 sm:space-y-4" aria-labelledby="analytics-charts-heading">
        <h2 id="analytics-charts-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-800/90">
          Performance overview
        </h2>
        <div className={dashboardChartsGridClass}>
          <RevenueChart data={revenueSeries} loading={loading} title="Revenue" />
          <CallsChart data={callsChartData} loading={loading} title="Call performance" />
          <ConversionChart data={conversionChartData} loading={loading} title="Conversion rate" />
          <LeadsOverviewChart stats={stats} loading={loading} title="Leads & pipeline" />
        </div>
      </section>
    </div>
  );
}
