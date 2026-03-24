const tableOuterClass =
  'overflow-hidden rounded-2xl border border-violet-200/45 bg-gradient-to-br from-white via-violet-50/20 to-indigo-50/10 shadow-lg shadow-indigo-950/[0.06] ring-1 ring-violet-100/40 backdrop-blur-sm';

const tableHeadClass =
  'border-b border-violet-200/50 bg-gradient-to-r from-violet-100/50 via-indigo-50/40 to-violet-50/30 px-4 py-4 sm:px-6';

export default function RecentCallsTable({ data, loading }) {
  const rows = Array.isArray(data) ? data : (data?.calls ?? data?.recent ?? data?.data) ?? [];

  if (loading) {
    return (
      <div className={tableOuterClass}>
        <div className={tableHeadClass}>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recent calls</h2>
          <p className="mt-0.5 text-xs text-slate-600">Latest activity from your voice agent</p>
        </div>
        <div className="space-y-2.5 p-4 sm:p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded-xl bg-gradient-to-r from-violet-100/90 via-indigo-50/80 to-violet-50/60"
            />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={tableOuterClass}>
        <div className={tableHeadClass}>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recent calls</h2>
          <p className="mt-0.5 text-xs text-slate-600">Latest activity from your voice agent</p>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100/80 text-violet-600 ring-4 ring-violet-50" aria-hidden>
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">No recent calls yet</p>
          <p className="max-w-xs text-xs text-slate-500">When calls come in, they&apos;ll show up here with name, phone, duration, and outcome.</p>
        </div>
      </div>
    );
  }

  const columns = [
    { key: 'name', label: 'Name', keys: ['name', 'contact_name', 'caller_name', 'contactName', 'callerName'] },
    { key: 'phone', label: 'Phone', keys: ['phone', 'phone_number', 'phoneNumber', 'to', 'contact_phone'] },
    { key: 'duration', label: 'Duration', keys: ['duration', 'duration_seconds', 'call_duration', 'length'] },
    { key: 'outcome', label: 'Outcome', keys: ['outcome', 'status', 'disposition', 'result', 'call_status'] },
  ];

  function getCellValue(row, col) {
    for (const k of col.keys) {
      const v = row[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return null;
  }

  function formatValue(val, colKey) {
    if (val == null) return '—';
    if (typeof val === 'object' && !(val instanceof Date)) return JSON.stringify(val);
    if (colKey === 'duration' && typeof val === 'number') return `${val}s`;
    return String(val);
  }

  return (
    <div className={tableOuterClass}>
      <div className={tableHeadClass}>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recent calls</h2>
            <p className="mt-0.5 text-xs text-slate-600">Latest activity from your voice agent</p>
          </div>
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-violet-600/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-violet-800 sm:mt-0">
            Last {Math.min(rows.length, 10)} shown
          </span>
        </div>
      </div>

      <div className="table-scroll-x scroll-smooth overflow-x-auto overscroll-x-contain px-1 pb-2 pt-0 sm:px-0 sm:pb-3">
        <table className="w-full min-w-[36rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-violet-200/60 bg-slate-50/95">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-violet-950/80 sm:px-5"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((row, i) => (
              <tr
                key={row.id ?? i}
                className="border-b border-violet-100/65 transition-colors hover:bg-violet-50/45"
              >
                {columns.map((col) => {
                  const raw = formatValue(getCellValue(row, col), col.key);
                  const isOutcome = col.key === 'outcome';
                  const isPhone = col.key === 'phone';
                  const isName = col.key === 'name';
                  return (
                    <td
                      key={col.key}
                      className={`max-w-[10rem] px-4 py-3.5 align-middle text-sm text-slate-700 sm:max-w-none sm:px-5 ${
                        isName ? 'font-medium text-slate-900' : ''
                      } ${isPhone ? 'whitespace-nowrap font-mono text-[13px] text-slate-800' : ''}`}
                    >
                      {isOutcome && raw !== '—' ? (
                        <span className="inline-flex max-w-full items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-900 ring-1 ring-indigo-100">
                          <span className="truncate">{raw}</span>
                        </span>
                      ) : (
                        <span className={isOutcome ? 'text-slate-400' : ''}>{raw}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
