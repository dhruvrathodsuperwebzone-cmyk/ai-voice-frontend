const cardShell =
  'flex min-h-[132px] flex-col justify-between rounded-2xl border border-violet-200/45 bg-gradient-to-br from-white via-white to-violet-50/40 p-5 shadow-md shadow-indigo-950/[0.06] ring-1 ring-violet-100/40 backdrop-blur-sm transition-[box-shadow,transform] hover:shadow-lg hover:shadow-indigo-950/[0.08] sm:min-h-[140px] sm:p-6';

const iconWrap =
  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-2 ring-white shadow-sm';

const agentCardsConfig = [
  {
    label: 'Calls handled',
    valueKey: 'totalCalls',
    altKeys: ['total_calls', 'calls_made', 'calls'],
    format: (v) => (v != null ? Number(v).toLocaleString() : '0'),
    icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    accent: 'border-l-violet-500 bg-gradient-to-br from-violet-50/80 to-white',
    iconBg: 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white',
  },
  {
    label: 'Revenue',
    valueKey: 'revenue',
    altKeys: ['totalRevenue', 'total_revenue'],
    format: (v) => (typeof v === 'number' ? `₹${v.toLocaleString()}` : v ?? '₹0'),
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    accent: 'border-l-emerald-500 bg-gradient-to-br from-emerald-50/70 to-white',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
  },
  {
    label: 'Conversion rate',
    valueKey: 'conversionRate',
    altKeys: ['conversion_rate'],
    format: (v) => (typeof v === 'number' ? `${v.toFixed(1)}%` : v ?? '0%'),
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    accent: 'border-l-amber-500 bg-gradient-to-br from-amber-50/70 to-white',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
  },
];

const cardsConfig = [
  {
    label: 'Total Calls',
    valueKey: 'totalCalls',
    altKeys: ['total_calls', 'calls_made', 'calls'],
    format: (v) => (v != null ? Number(v).toLocaleString() : '0'),
    icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
    accent: 'border-l-indigo-500 bg-gradient-to-br from-indigo-50/80 to-white',
    iconBg: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white',
  },
  {
    label: 'Revenue',
    valueKey: 'revenue',
    altKeys: ['totalRevenue', 'total_revenue'],
    format: (v) => (typeof v === 'number' ? `₹${v.toLocaleString()}` : v ?? '₹0'),
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    accent: 'border-l-emerald-500 bg-gradient-to-br from-emerald-50/70 to-white',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
  },
  {
    label: 'Meetings',
    valueKey: 'meetings',
    altKeys: ['totalMeetings', 'total_meetings', 'scheduledMeetings'],
    format: (v) => (v != null ? Number(v).toLocaleString() : '0'),
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    accent: 'border-l-purple-500 bg-gradient-to-br from-purple-50/70 to-white',
    iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600 text-white',
  },
  {
    label: 'Conversion Rate',
    valueKey: 'conversionRate',
    altKeys: ['conversion_rate'],
    format: (v) => (typeof v === 'number' ? `${v.toFixed(1)}%` : v ?? '0%'),
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    accent: 'border-l-amber-500 bg-gradient-to-br from-amber-50/70 to-white',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
  },
];

function getValue(s, config) {
  let v = s[config.valueKey];
  for (const k of config.altKeys || []) {
    if (v != null) break;
    v = s[k];
  }
  return v;
}

/** ≤4 cards: 2 columns (2×2). ≥5 cards: 3 columns from lg (3×2 / 3×3). */
function statsGridClass(cardCount) {
  const threeCol = cardCount >= 5;
  return `grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 ${threeCol ? 'lg:grid-cols-3 lg:gap-6' : ''}`.trim();
}

export default function StatsCards({ stats, loading, variant }) {
  const s = stats?.data ?? stats ?? {};
  const config = variant === 'agent' ? agentCardsConfig : cardsConfig;
  const gridClass = statsGridClass(config.length);

  if (loading) {
    const skeletonCount = variant === 'agent' ? 3 : 4;
    return (
      <div className={statsGridClass(skeletonCount)}>
        {Array.from({ length: skeletonCount }, (_, i) => i + 1).map((i) => (
          <div key={i} className={`${cardShell} animate-pulse border-l-4 border-l-violet-200`}>
            <div className="flex items-start justify-between">
              <div className="h-11 w-11 rounded-xl bg-violet-100/80" />
              <div className="h-8 w-20 rounded-lg bg-slate-200/80" />
            </div>
            <div className="mt-4 h-4 w-28 rounded bg-slate-200/80" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {config.map((card) => {
        const value = getValue(s, card);
        const display = card.format(value);
        return (
          <div key={card.label} className={`${cardShell} border-l-4 p-5 ${card.accent}`}>
            <div className="flex items-start justify-between gap-3">
              <div className={`${iconWrap} ${card.iconBg}`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">{display}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600">{card.label}</p>
          </div>
        );
      })}
    </div>
  );
}
