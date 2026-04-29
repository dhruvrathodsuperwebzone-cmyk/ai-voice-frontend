import { useMemo } from 'react';
import { PaginationBar } from '../PaginationBar';
import PageLoader from '../PageLoader';

const STATUS_STYLES = {
  completed: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70',
  paid: 'bg-emerald-50 text-emerald-800 ring-emerald-200/70',
  created: 'bg-slate-100 text-slate-700 ring-slate-200/70',
  pending: 'bg-amber-50 text-amber-800 ring-amber-200/70',
  expired: 'bg-slate-100 text-slate-500 ring-slate-200/60',
  failed: 'bg-red-50 text-red-800 ring-red-200/70',
};

function StatusPill({ status }) {
  const s = (status || 'created').toLowerCase();
  const c = STATUS_STYLES[s] || STATUS_STYLES.created;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${c}`}>
      {s}
    </span>
  );
}

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleString();
  } catch {
    return val;
  }
}

function formatAmount(amount, currency = 'INR') {
  if (amount == null) return '—';
  const n = Number(amount);
  if (Number.isNaN(n)) return String(amount);
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  return `${sym}${n.toLocaleString()}`;
}

const thClass =
  'whitespace-nowrap px-4 py-4 text-center text-sm font-semibold text-slate-700 sm:px-5 first:pl-6 last:pr-6';

export default function PaymentTable({
  payments = [],
  loading,
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  statusFilter = '',
  onStatusFilterChange,
  onViewInvoice,
}) {
  const totalCount = total > 0 ? total : payments.length;
  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize]);
  const startRow =
    totalCount === 0 || payments.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow =
    totalCount === 0 || payments.length === 0 ? 0 : startRow + payments.length - 1;
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <PageLoader message="Loading payments…" className="py-4" size="md" />
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100/90 to-indigo-100/70 ring-1 ring-violet-200/50">
          <svg className="h-7 w-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <p className="mt-4 text-base font-medium text-slate-800">No payments yet</p>
        <p className="mt-1 text-sm text-slate-500">Create a payment link to get started.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[56rem] border-collapse text-center">
          <caption className="sr-only">Payment history: customer, amount, status, and actions</caption>
          <thead>
            <tr className="border-b border-indigo-200/50 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-violet-50/20">
                <th scope="col" className={thClass}>Sr. No.</th>
              <th scope="col" className={thClass}>Customer</th>
              <th scope="col" className={thClass}>Amount</th>
              <th scope="col" className={thClass}>Status</th>
              <th scope="col" className={thClass}>Created</th>
              <th scope="col" className={thClass}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
              {payments.map((p, idx) => (
              <tr key={p.id} className="bg-white transition-colors hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 align-middle text-sm first:pl-6 sm:px-5">
                    <span className="font-semibold text-slate-700">{startRow + idx}</span>
                  </td>
                <td className="px-4 py-3.5 align-middle sm:px-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{p.customer_name ?? p.customer?.name ?? '—'}</p>
                    <p className="text-xs text-slate-500">{p.customer_email ?? p.customer?.email ?? '—'}</p>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-sm font-semibold text-slate-800 sm:px-5">
                  {formatAmount(p.amount, p.currency)}
                </td>
                <td className="px-4 py-3.5 align-middle sm:px-5">
                  <StatusPill status={p.status} />
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600 sm:px-5">{formatDate(p.created_at ?? p.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3.5 align-middle last:pr-6 sm:px-5">
                  {onViewInvoice && (
                    <button
                      type="button"
                      onClick={() => onViewInvoice(p)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100/80 sm:text-sm"
                    >
                      View
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onPageChange && payments.length > 0 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPage={onPageChange}
          variant="simple"
          size="compact"
          className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        />
      )}
    </div>
  );
}
