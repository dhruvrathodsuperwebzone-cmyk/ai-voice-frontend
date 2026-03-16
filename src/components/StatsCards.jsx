const cardBase = 'bg-white border border-slate-200 rounded-xl p-5 shadow-sm';
const iconWrap = 'w-10 h-10 rounded-lg flex items-center justify-center';

export default function StatsCards({ stats, loading }) {
  // Support both flat stats and nested { data: { ... } } from API
  const s = stats?.data ?? stats ?? {};

  const cards = [
    {
      label: 'Total Calls',
      value: s.totalCalls ?? s.total_calls ?? s.calls_made ?? s.calls ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      iconBg: 'bg-indigo-100 text-indigo-600',
    },
    {
      label: 'Revenue',
      value:
        typeof (s.revenue ?? s.totalRevenue ?? s.total_revenue) === 'number'
          ? `₹${(s.revenue ?? s.totalRevenue ?? s.total_revenue).toLocaleString()}`
          : (s.revenue ?? s.totalRevenue ?? s.total_revenue) ?? '₹0',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      label: 'Meetings',
      value: s.meetings ?? s.totalMeetings ?? s.total_meetings ?? s.scheduledMeetings ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: 'bg-violet-100 text-violet-600',
    },
    {
      label: 'Active Campaigns',
      value: s.activeCampaigns ?? s.active_campaigns ?? s.campaigns ?? s.totalCampaigns ?? 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      iconBg: 'bg-sky-100 text-sky-600',
    },
    {
      label: 'Conversion Rate',
      value:
        typeof (s.conversionRate ?? s.conversion_rate) === 'number'
          ? `${(s.conversionRate ?? s.conversion_rate).toFixed(1)}%`
          : (s.conversionRate ?? s.conversion_rate) ?? '0%',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      iconBg: 'bg-amber-100 text-amber-600',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`${cardBase} animate-pulse`}>
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-slate-200" />
              <div className="h-8 w-16 rounded bg-slate-200" />
            </div>
            <div className="mt-3 h-4 w-24 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={cardBase}>
          <div className="flex items-center justify-between">
            <div className={`${iconWrap} ${card.iconBg}`}>{card.icon}</div>
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{card.value}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
