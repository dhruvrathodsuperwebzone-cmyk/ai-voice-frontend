export default function RecentCallsTable({ data, loading }) {
  const rows = Array.isArray(data) ? data : (data?.calls ?? data?.recent ?? data?.data) ?? [];

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Calls</h2>
        </div>
        <div className="p-6 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Recent Calls</h2>
        </div>
        <div className="p-8 text-center text-slate-500 text-sm">No recent calls yet.</div>
      </div>
    );
  }

  // Table shows only: Name, Phone, Duration, Outcome
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
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
      <div className="px-5 py-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Recent Calls</h2>
      </div>
      <table className="w-full min-w-[400px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.slice(0, 10).map((row, i) => (
            <tr key={row.id ?? i} className="hover:bg-slate-50/50">
              {columns.map((col) => (
                <td key={col.key} className="px-5 py-3 text-sm text-slate-700">
                  {formatValue(getCellValue(row, col), col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
