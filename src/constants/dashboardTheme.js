/** Pixel height for Recharts ResponsiveContainer — keeps cards aligned in the grid. */
export const DASHBOARD_CHART_HEIGHT = 248;

/**
 * Dashboard chart card shell: gradient fill, left accent, equal min-height for 2×2 grids.
 * @param {string} borderLeft — Tailwind border-l-* + optional bg tint classes
 */
export function dashboardChartShell(borderLeft) {
  return [
    'flex h-full min-h-[288px] flex-col rounded-2xl border border-violet-200/45 p-5 shadow-md shadow-indigo-950/[0.06] ring-1 ring-violet-100/40 backdrop-blur-sm sm:min-h-[308px] sm:p-6',
    'border-l-4 bg-gradient-to-br from-white via-violet-50/25 to-indigo-50/15',
    borderLeft,
  ].join(' ');
}

/** Stats + charts section spacing on dashboard */
export const dashboardChartsGridClass =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6';
