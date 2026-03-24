import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPaymentLink, getPayments } from '../services/paymentService';
import { getLeads } from '../services/leadsService';
import RevenueChart from '../components/charts/RevenueChart';
import PaymentTable from '../components/payments/PaymentTable';
import InvoiceViewer from '../components/payments/InvoiceViewer';

const PAGE_SIZES = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

function safePaymentsList(res) {
  const data = res?.data ?? res;
  const list = Array.isArray(data?.payments) ? data.payments : (Array.isArray(data) ? data : []);
  const total = data?.total ?? data?.count ?? list.length;
  return { list, total };
}

function StatCard({ label, value, accent, icon }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6 ${accent}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-600 shadow-sm ring-1 ring-slate-200/60">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [form, setForm] = useState({
    amount: 4999,
    currency: 'INR',
    description: 'AI Receptionist Setup',
    customer: { name: '', email: '', contact: '' },
    lead_id: '',
    send_sms: true,
  });

  const [leads, setLeads] = useState([]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: pageSize };
      if (statusFilter) params.status = statusFilter;
      const res = await getPayments(params);
      const { list, total: t } = safePaymentsList(res);
      setPayments(list);
      setTotal(t);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load payments');
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  useEffect(() => {
    let cancelled = false;
    getLeads({ limit: 200 })
      .then((res) => {
        const data = res?.data ?? res;
        const list = Array.isArray(data?.leads) ? data.leads : (Array.isArray(data) ? data : []);
        if (!cancelled) setLeads(list);
      })
      .catch(() => { if (!cancelled) setLeads([]); });
    return () => { cancelled = true; };
  }, []);

  const chartData = useMemo(() => {
    const paid = payments.filter((p) => (p.status || '').toLowerCase() === 'paid');
    if (paid.length === 0) return [];
    const byDate = {};
    paid.forEach((p) => {
      const raw = p.created_at ?? p.createdAt;
      const key = raw ? new Date(raw).toLocaleDateString() : `#${p.id}`;
      byDate[key] = (byDate[key] || 0) + Number(p.amount || 0);
    });
    return Object.entries(byDate).map(([name, revenue]) => ({ name, revenue }));
  }, [payments]);

  const summary = useMemo(() => {
    const paid = payments.filter((p) => (p.status || '').toLowerCase() === 'paid');
    const pending = payments.filter((p) => (p.status || '').toLowerCase() === 'pending' || (p.status || '').toLowerCase() === 'created');
    const totalPaid = paid.reduce((s, p) => s + Number(p.amount || 0), 0);
    return { totalPaid, paidCount: paid.length, pendingCount: pending.length };
  }, [payments]);

  async function handleCreateLink(e) {
    e.preventDefault();
    setCreating(true);
    setError('');
    setCreateSuccess(null);
    try {
      const payload = {
        amount: Number(form.amount) || 0,
        currency: form.currency || 'INR',
        description: (form.description || '').trim() || undefined,
        customer: {
          name: (form.customer?.name || '').trim() || undefined,
          email: (form.customer?.email || '').trim() || undefined,
          contact: (form.customer?.contact || '').trim() || undefined,
        },
        lead_id: form.lead_id ? Number(form.lead_id) : undefined,
        send_sms: !!form.send_sms,
      };
      const res = await createPaymentLink(payload);
      const data = res?.data ?? res;
      const url =
        data?.short_url ??
        data?.payment_link_url ??
        data?.url ??
        data?.link ??
        data?.payment_link?.short_url ??
        data?.payment_link?.url ??
        (typeof data?.payment_link === 'string' ? data.payment_link : null);
      setCreateSuccess({
        url: url || null,
        send_sms: !!payload.send_sms,
        contact: (payload.customer?.contact || '').trim() || null,
        message: data?.message ?? null,
      });
      setForm({
        amount: 4999,
        currency: 'INR',
        description: 'AI Receptionist Setup',
        customer: { name: '', email: '', contact: '' },
        lead_id: '',
        send_sms: true,
      });
      setPage(1);
      getPayments({ page: 1, limit: pageSize, ...(statusFilter && { status: statusFilter }) }).then((res) => {
        const { list, total: t } = safePaymentsList(res);
        setPayments(list);
        setTotal(t);
      }).catch(() => {});
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create payment link');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/30 p-6 shadow-md shadow-indigo-950/[0.04] ring-1 ring-violet-100/50 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600/90">Billing</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <span className="bg-black bg-clip-text text-transparent">
                Payments
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              Create Razorpay links, track status, and review revenue from the payments on this page.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-900 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              UPI · Card · Netbanking
            </span>
          </div>
        </div>
      </header>

      {error && (
        <div
          className="flex gap-3 rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900 shadow-sm ring-1 ring-red-100/60"
          role="alert"
        >
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {createSuccess && (
        <div className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-md shadow-emerald-900/[0.04] ring-1 ring-emerald-100/60">
          <div className="border-b border-emerald-100/90 bg-gradient-to-r from-emerald-50/95 via-white to-teal-50/40 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/70">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-900">Payment link created</p>
                <p className="mt-0.5 text-xs text-emerald-800/90">Share the link below or dismiss when you are done.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 px-5 py-5 text-sm text-emerald-900 sm:px-6">
            {createSuccess.url ? (
              <>
                <p className="text-emerald-800">Share this link with the customer (they can pay via UPI, card, or net banking):</p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createSuccess.url}
                    className="min-w-[200px] flex-1 rounded-xl border border-emerald-200 bg-slate-50/80 px-3 py-2.5 font-mono text-sm text-slate-800 shadow-sm ring-1 ring-emerald-100/50"
                  />
                  <a
                    href={createSuccess.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500"
                  >
                    Open link
                  </a>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(createSuccess.url)}
                    className="shrink-0 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-emerald-800 shadow-sm transition-colors hover:bg-emerald-50"
                  >
                    Copy link
                  </button>
                </div>
              </>
            ) : (
              <p className="text-emerald-800">
                Link was created on the server. If your backend returns the URL in the API response, it will show above. Check <strong className="font-semibold text-emerald-900">Payment history</strong> below for the new payment.
              </p>
            )}

            {createSuccess.send_sms && (
              <p className="border-t border-emerald-100 pt-4 text-emerald-800">
                SMS was requested to be sent to the customer’s number{createSuccess.contact ? `: ${createSuccess.contact}` : ''}. If the backend has SMS configured, the link will be sent to that mobile.
              </p>
            )}

            <button
              type="button"
              onClick={() => setCreateSuccess(null)}
              className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:text-emerald-900 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/[0.04] ring-1 ring-slate-100/90">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-500 via-indigo-500 to-emerald-500"
          aria-hidden
        />
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-violet-50/25 px-5 py-5 sm:px-7">
          <h2 className="text-lg font-bold text-slate-900">Create payment link</h2>
          <p className="mt-1 text-sm text-slate-600">Send a Razorpay link to a customer (optional SMS).</p>
        </div>
        <form onSubmit={handleCreateLink} className="relative space-y-5 p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>Amount</label>
              <input
                type="number"
                min={1}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                className={fieldClass}
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <label className={labelClass}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. AI Receptionist Setup"
                className={fieldClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Customer name</label>
              <input
                type="text"
                value={form.customer?.name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, customer: { ...f.customer, name: e.target.value } }))}
                placeholder="Rahul Sharma"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={form.customer?.email ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, customer: { ...f.customer, email: e.target.value } }))}
                placeholder="rahul@example.com"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>Contact</label>
              <input
                type="text"
                value={form.customer?.contact ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, customer: { ...f.customer, contact: e.target.value } }))}
                placeholder="+919876543210"
                className={fieldClass}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[12rem] flex-1 sm:max-w-xs">
              <label className={labelClass}>Lead (optional)</label>
              <select
                value={form.lead_id}
                onChange={(e) => setForm((f) => ({ ...f, lead_id: e.target.value }))}
                className={fieldClass}
              >
                <option value="">None</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>{l.hotel_name || l.owner_name || `Lead #${l.id}`}</option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 shadow-sm ring-1 ring-slate-100/80 sm:py-2.5">
              <input
                type="checkbox"
                checked={!!form.send_sms}
                onChange={(e) => setForm((f) => ({ ...f, send_sms: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">Send SMS</span>
            </label>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={creating}
              className="btn-primary-gradient rounded-xl px-5 py-3 text-sm font-semibold shadow-md shadow-indigo-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 sm:py-2.5"
            >
              {creating ? 'Creating…' : 'Create payment link'}
            </button>
          </div>
        </form>
      </div>

      <section className="space-y-3 sm:space-y-4" aria-labelledby="payments-overview-heading">
        <h2 id="payments-overview-heading" className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-800/90">
          Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-3 lg:gap-5">
          <StatCard
            label="Paid (this page)"
            value={`₹${summary.totalPaid.toLocaleString()}`}
            accent="from-emerald-50/90 via-white to-teal-50/30 border-l-4 border-l-emerald-500"
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
          <StatCard
            label="Pending"
            value={String(summary.pendingCount)}
            accent="from-amber-50/90 via-white to-orange-50/20 border-l-4 border-l-amber-500"
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
          <StatCard
            label="Paid count"
            value={String(summary.paidCount)}
            accent="from-indigo-50/90 via-white to-violet-50/25 border-l-4 border-l-indigo-500"
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
        </div>
        <div className="pt-1">
          <RevenueChart data={chartData} loading={loading} title="Payment revenue (from list)" />
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.03] ring-1 ring-slate-100/80">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment history</h2>
            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">Filter by status and open invoices from the list.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              <option value="">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="created">Created</option>
              <option value="expired">Expired</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <PaymentTable
          payments={payments}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
          onViewInvoice={setSelectedPayment}
        />
      </div>

      {selectedPayment && (
        <InvoiceViewer payment={selectedPayment} onClose={() => setSelectedPayment(null)} />
      )}
    </div>
  );
}
