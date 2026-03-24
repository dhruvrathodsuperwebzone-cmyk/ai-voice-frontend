import { Link } from 'react-router-dom';

function formatSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return '—';
  const start = schedule.start ?? schedule.start_time;
  const end = schedule.end ?? schedule.end_time;
  const days = schedule.days;
  const dayStr = Array.isArray(days) && days.length ? `${days.length} days` : '';
  const timeStr = [start, end].filter(Boolean).join('–');
  return [dayStr, timeStr].filter(Boolean).join(' · ') || '—';
}

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-slate-100 text-slate-700 ring-slate-200/60',
    scheduled: 'bg-indigo-50 text-indigo-700 ring-indigo-200/60',
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
    paused: 'bg-amber-50 text-amber-700 ring-amber-200/60',
    completed: 'bg-slate-100 text-slate-600 ring-slate-200/60',
  };
  const cls = styles[status] || styles.draft;
  const label = status ? String(status).replace(/_/g, ' ') : '—';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

const thClass =
  'whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700 sm:px-5 first:pl-6 last:pr-6';

export default function CampaignTable({
  campaigns,
  scriptNamesById = {},
  onDelete,
  deleteConfirmId,
  onConfirmDelete,
  onCancelDelete,
}) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100/90 to-indigo-100/70 ring-1 ring-violet-200/50">
          <svg className="h-7 w-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="mt-4 text-base font-medium text-slate-800">No campaigns yet</p>
        <p className="mt-1 text-sm text-slate-500">Create your first campaign to start reaching leads.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[52rem] border-collapse text-left">
        <caption className="sr-only">Outbound campaigns: script, schedule, status, and lead counts</caption>
        <thead>
          <tr className="border-b border-indigo-200/50 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-violet-50/20">
            <th scope="col" className={thClass}>Name</th>
            <th scope="col" className={`${thClass} hidden md:table-cell`}>Script</th>
            <th scope="col" className={`${thClass} hidden lg:table-cell`}>Schedule</th>
            <th scope="col" className={`${thClass} hidden lg:table-cell`}>Timezone</th>
            <th scope="col" className={thClass}>Status</th>
            <th scope="col" className={`${thClass} hidden lg:table-cell`}>Leads</th>
            <th scope="col" className={`${thClass} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {campaigns.map((c) => (
            <tr key={c.id} className="bg-white transition-colors hover:bg-slate-50/80">
              <td className="whitespace-nowrap px-4 py-3.5 align-middle text-sm first:pl-6 sm:px-5">
                <Link
                  to={`/dashboard/campaigns/${c.id}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  {c.name ?? '—'}
                </Link>
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3.5 align-middle text-sm text-slate-600 md:table-cell sm:px-5">
                {c.script_name || (c.script_id != null ? (scriptNamesById[String(c.script_id)] || `Script ${c.script_id}`) : '—')}
              </td>
              <td className="hidden max-w-[180px] truncate px-4 py-3.5 align-middle text-sm text-slate-600 lg:table-cell sm:px-5" title={formatSchedule(c.schedule)}>
                {formatSchedule(c.schedule)}
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3.5 align-middle text-sm text-slate-600 lg:table-cell sm:px-5">
                {c.timezone ?? '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 align-middle sm:px-5">
                <StatusBadge status={c.status} />
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3.5 align-middle text-sm text-slate-600 lg:table-cell sm:px-5">
                {Array.isArray(c.lead_list) ? c.lead_list.length : 0}
              </td>
              <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle last:pr-6 sm:px-5">
                <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                  <Link
                    to={`/dashboard/campaigns/${c.id}`}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100/80 sm:text-sm"
                  >
                    View
                  </Link>
                  {onDelete && (deleteConfirmId === c.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onConfirmDelete(c.id)}
                        className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-500 sm:text-sm"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={onCancelDelete}
                        className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 sm:text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700 sm:text-sm"
                    >
                      Delete
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
