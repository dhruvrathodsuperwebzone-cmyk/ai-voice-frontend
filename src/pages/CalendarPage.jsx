import { useCallback, useEffect, useMemo, useState } from 'react';
import { PaginationBar } from '../components/PaginationBar';
import PageLoader from '../components/PageLoader';
import { useToast } from '../store/toastContext';
import { getCalendarEvents } from '../services/calendarService';

const PAGE_SIZE = 10;

function normalizeRows(data) {
  const rows =
    data?.data?.items ??
    data?.items ??
    data?.data ??
    data?.rows ??
    (Array.isArray(data) ? data : []);
  return Array.isArray(rows) ? rows : [];
}

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** `YYYY-MM-DD` for input type="date" in local timezone */
function toDateInputValue(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Start of local calendar day → end of local calendar day (inclusive range). */
function localDateRangeToISO(fromStr, toStr) {
  const [fy, fm, fd] = fromStr.split('-').map(Number);
  const [ty, tm, td] = toStr.split('-').map(Number);
  const start = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
  let end = new Date(ty, tm - 1, td, 23, 59, 59, 999);
  if (end < start) end = new Date(fy, fm - 1, fd, 23, 59, 59, 999);
  return { timeMin: start.toISOString(), timeMax: end.toISOString() };
}

const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Next 7 days' },
  { id: 'month', label: 'This month' },
];

export default function CalendarPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState(() => toDateInputValue());
  const [dateTo, setDateTo] = useState(() => toDateInputValue());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { timeMin, timeMax } = localDateRangeToISO(dateFrom, dateTo);
        const res = await getCalendarEvents({
          timeMin,
          timeMax,
          maxResults: 250,
        });
        if (cancelled) return;
        setRows(normalizeRows(res));
        setPage(1);
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setPage(1);
        const msg = err?.response?.data?.message || err?.message || 'Failed to load calendar data.';
        toast.error(msg, { title: 'Calendar load failed' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [toast, dateFrom, dateTo]);

  const applyPreset = useCallback((id) => {
    const today = new Date();
    if (id === 'today') {
      const v = toDateInputValue(today);
      setDateFrom(v);
      setDateTo(v);
      return;
    }
    if (id === 'week') {
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      setDateFrom(toDateInputValue(today));
      setDateTo(toDateInputValue(end));
      return;
    }
    if (id === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setDateFrom(toDateInputValue(start));
      setDateTo(toDateInputValue(end));
    }
  }, []);

  const rangeLabel = useMemo(() => {
    try {
      const a = new Date(`${dateFrom}T12:00:00`);
      const b = new Date(`${dateTo}T12:00:00`);
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';
      if (dateFrom === dateTo) {
        return a.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      }
      return `${a.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${b.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return '';
    }
  }, [dateFrom, dateTo]);

  const showLocationColumn = useMemo(
    () => rows.some((r) => String(r?.location ?? r?.location_name ?? '').trim() !== ''),
    [rows],
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const pagedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const inputClass =
    'w-full min-h-[2.75rem] rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 [color-scheme:light]';

  const thClass =
    'whitespace-nowrap px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 first:pl-6 last:pr-6';

  const tdClass = 'px-5 py-4 align-middle text-sm text-slate-800 first:pl-6 last:pr-6';

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/50 to-indigo-50/40 p-7 shadow-lg shadow-indigo-950/[0.06] ring-1 ring-violet-100/60 sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-violet-400/18 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-40 w-72 rounded-full bg-indigo-400/12 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600/95">Calendar</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Google Calendar</h1>
            
            </div>
          </div>
          <div className="shrink-0 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-3 py-2 text-xs font-medium text-emerald-900 shadow-sm sm:text-[13px]">
            Live sync · Google Calendar API
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.04] ring-1 ring-slate-100/90">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/95 via-indigo-50/35 to-violet-50/30 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Date range</h2>
              <p className="mt-1 text-sm text-slate-600">
                {rangeLabel ? <span className="font-medium text-slate-700">{rangeLabel}</span> : 'Pick dates to load events.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyPreset(id)}
                  className="rounded-xl border border-slate-200/90 bg-white/90 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-white hover:text-indigo-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500/30 sm:text-sm"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:max-w-xl">
            <div>
              <label htmlFor="calendar-date-from" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                From
              </label>
              <input
                id="calendar-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  const v = e.target.value;
                  setDateFrom(v);
                  setDateTo((prev) => (prev < v ? v : prev));
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="calendar-date-to" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                To
              </label>
              <input
                id="calendar-date-to"
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="p-1 sm:p-0">
          {loading ? (
            <PageLoader message="Loading events…" className="px-6 py-20 sm:py-24" size="md" />
          ) : rows.length === 0 ? (
            <div className="mx-auto max-w-md px-6 py-16 text-center sm:py-20">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 ring-1 ring-slate-200/80">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.25} stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5a2.25 2.25 0 0 0 2.25-2.25m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5a2.25 2.25 0 0 1 2.25 2.25v7.5"
                  />
                </svg>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-slate-900">No events in this range</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Try another date range or a quick preset. If you expect events here, confirm this account has completed
                Google Calendar linking.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 border-b border-slate-100 bg-slate-50/50 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-sm font-semibold text-slate-800">
                  {rows.length} event{rows.length === 1 ? '' : 's'}
                </p>
             
              </div>
              <div className="overflow-x-auto overscroll-x-contain">
                <table className="w-full min-w-[42rem] border-collapse text-left">
                  <caption className="sr-only">Google Calendar events for the selected date range</caption>
                  <thead>
                    <tr className="border-b border-indigo-200/50 bg-gradient-to-r from-slate-50 via-indigo-50/50 to-violet-50/30">
                      <th scope="col" className={`${thClass} min-w-[12rem]`}>
                        Event
                      </th>
                      <th scope="col" className={thClass}>
                        Starts
                      </th>
                      <th scope="col" className={thClass}>
                        Ends
                      </th>
                      {showLocationColumn ? (
                        <th scope="col" className={`${thClass} min-w-[10rem]`}>
                          Location
                        </th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/90">
                    {pagedRows.map((row, index) => {
                      const title = row?.summary ?? row?.title ?? row?.event_name ?? 'Untitled event';
                      const startRaw = row?.start?.dateTime ?? row?.start?.date ?? row?.date ?? row?.start_time;
                      const endRaw = row?.end?.dateTime ?? row?.end?.date ?? row?.end_time;
                      const loc = String(row?.location ?? row?.location_name ?? '').trim();
                      const key = row?.id ?? row?._id ?? `${title}-${(page - 1) * PAGE_SIZE + index}`;
                      return (
                        <tr
                          key={key}
                          className="transition-colors odd:bg-white even:bg-slate-50/50 hover:bg-indigo-50/40"
                        >
                          <td className={`${tdClass} font-semibold text-slate-900`}>{title}</td>
                          <td className={`${tdClass} tabular-nums text-slate-700`}>{formatDateTime(startRaw)}</td>
                          <td className={`${tdClass} tabular-nums text-slate-600`}>
                            {endRaw ? formatDateTime(endRaw) : '—'}
                          </td>
                          {showLocationColumn ? (
                            <td className={`${tdClass} text-slate-600`}>{loc || '—'}</td>
                          ) : null}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalCount={rows.length}
                pageSize={PAGE_SIZE}
                onPage={setPage}
                disabled={loading}
                variant="full"
                size="compact"
                hideWhenSinglePage
                className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                summaryExtra={<span className="text-slate-400"> · {PAGE_SIZE} per page</span>}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
