import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import {
  getLeads,
  getLeadsByCreator,
  getLeadById,
  createLead,
  updateLead,
  updateLeadAsAdmin,
  deleteLead,
  deleteLeadAsAdmin,
  importLeads,
} from '../services/leadsService';
import LeadForm from '../components/LeadForm';
import ImportLeadsModal from '../components/ImportLeadsModal';
import { useToast } from '../store/toastContext';
import { resolveTotalForPagination } from '../utils/pagination';
import { downloadLeadsImportTemplate } from '../utils/spreadsheetDownload';
import { PaginationBar } from '../components/PaginationBar';
import { getUserNames, normalizeUserNamesList } from '../services/usersService';
import UiSelect from '../components/UiSelect';
import PageLoader from '../components/PageLoader';

const PAGE_SIZE = 10;

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString();
  } catch {
    return val;
  }
}

export default function LeadsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const role = getRole(user);
  const isViewer = role === 'viewer';
  const isAgent = role === 'agent';
  const isAdmin = role === 'admin';
  /** Same “Users” filter + by-creator API as admin; read-only for viewers. */
  const canFilterLeadsByCreator = isAdmin || isViewer;

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formModal, setFormModal] = useState({ open: false, lead: null });
  const [formSaving, setFormSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteDeleting, setDeleteDeleting] = useState(false);

  const [userNameOptions, setUserNameOptions] = useState([]);
  const [userNamesLoading, setUserNamesLoading] = useState(false);
  /** Admin “Users” filter: empty = all creators; selected user id → ?user_id=… on GET /leads/by-creator */
  const [selectedCreatorId, setSelectedCreatorId] = useState('');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (canFilterLeadsByCreator && selectedCreatorId) {
        const raw = String(selectedCreatorId).trim();
        const idNum = Number(raw);
        params.user_id = Number.isFinite(idNum) && String(idNum) === raw ? idNum : raw;
      }
      // GET /leads/by-creator requires user_id. Use plain /leads when “All users” (no selection).
      const res =
        canFilterLeadsByCreator && selectedCreatorId
          ? await getLeadsByCreator(params)
          : await getLeads(params);
      // Supports { data: Lead[] }, { data: { leads, total } }, { leads, total }, plus totals on the envelope.
      const inner = res?.data;
      const list = Array.isArray(inner?.leads)
        ? inner.leads
        : Array.isArray(inner)
          ? inner
          : Array.isArray(res?.leads)
            ? res.leads
            : [];
      setLeads(list);

      const minKnownTotal = (page - 1) * PAGE_SIZE + list.length;
      const apiTotalRaw =
        res?.total ??
        res?.count ??
        (typeof inner === 'object' && inner != null && !Array.isArray(inner)
          ? inner.total ?? inner.count ?? inner.pagination?.total ?? inner.pagination?.count
          : undefined) ??
        res?.pagination?.total ??
        res?.pagination?.count ??
        res?.meta?.total ??
        res?.meta?.count;

      const apiTotal =
        apiTotalRaw != null && String(apiTotalRaw).trim() !== '' && Number.isFinite(Number(apiTotalRaw))
          ? Number(apiTotalRaw)
          : minKnownTotal;

      const resolved = resolveTotalForPagination(page, PAGE_SIZE, list.length, apiTotal, res);
      setTotal(resolved);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load leads');
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, canFilterLeadsByCreator, selectedCreatorId]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    if (!canFilterLeadsByCreator) {
      setUserNameOptions([]);
      setSelectedCreatorId('');
      return;
    }
    let cancelled = false;
    async function loadUserNames() {
      setUserNamesLoading(true);
      try {
        const res = await getUserNames();
        if (cancelled) return;
        setUserNameOptions(normalizeUserNamesList(res));
      } catch (err) {
        if (cancelled) return;
        setUserNameOptions([]);
        toast.error(err?.response?.data?.message || err?.message || 'Failed to load users', {
          title: 'Users list',
        });
      } finally {
        if (!cancelled) setUserNamesLoading(false);
      }
    }
    loadUserNames();
    return () => {
      cancelled = true;
    };
  }, [canFilterLeadsByCreator, toast]);

  const creatorFilterOptions = useMemo(() => {
    if (!canFilterLeadsByCreator) return [];
    if (userNamesLoading) return [];
    return [
      { value: '', label: 'All users' },
      ...userNameOptions.map((u) => ({ value: String(u.id), label: u.name })),
    ];
  }, [canFilterLeadsByCreator, userNamesLoading, userNameOptions]);

  useEffect(() => {
    if (deleteConfirm == null) return undefined;
    function onKeyDown(e) {
      if (e.key === 'Escape' && !deleteDeleting) setDeleteConfirm(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteConfirm, deleteDeleting]);

  function openCreate() { setFormModal({ open: true, lead: null }); }
  async function openEdit(id) {
    try {
      const res = await getLeadById(id);
      setFormModal({ open: true, lead: res?.data ?? res });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load lead';
      setError(msg);
      toast.error(msg, { title: 'Lead load failed' });
    }
  }
  function closeForm() { setFormModal({ open: false, lead: null }); }

  async function handleSave(payload) {
    setFormSaving(true);
    setError('');
    try {
      const leadId = formModal.lead?.id ?? formModal.lead?.lead_id ?? formModal.lead?._id;
      const editing = leadId != null && String(leadId).trim() !== '';
      if (editing) {
        if (isAdmin) await updateLeadAsAdmin(leadId, payload);
        else await updateLead(leadId, payload);
      } else await createLead(payload);
      closeForm();
      // Keep the list unfiltered after save so newly saved items are visible.
      setSearch('');
      setPage(1);
      fetchLeads();
      toast.success(editing ? 'Lead updated successfully.' : 'Lead created successfully.', { title: 'Success' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Save failed';
      setError(msg);
      toast.error(msg, { title: 'Save failed' });
    } finally {
      setFormSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    setDeleteDeleting(true);
    try {
      if (isAdmin) await deleteLeadAsAdmin(id);
      else await deleteLead(id);
      setDeleteConfirm(null);
      fetchLeads();
      toast.success('Lead deleted successfully.', { title: 'Success' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Delete failed';
      setError(msg);
      toast.error(msg, { title: 'Delete failed' });
    } finally {
      setDeleteDeleting(false);
    }
  }

  async function handleImport(formData) {
    setImporting(true);
    setError('');
    try {
      await importLeads(formData);
      setImportModalOpen(false);
      fetchLeads();
      toast.success('Leads imported successfully.', { title: 'Success' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Import failed';
      setError(msg);
      toast.error(msg, { title: 'Import failed' });
    } finally {
      setImporting(false);
    }
  }

  const leadPendingDelete =
    deleteConfirm != null ? leads.find((l) => String(l.id) === String(deleteConfirm)) : null;

  const totalCount = total > 0 ? total : leads.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startRow = totalCount === 0 || leads.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRow =
    totalCount === 0 || leads.length === 0 ? 0 : startRow + leads.length - 1;
  const canCreateOrImport = isAdmin || isAgent;

  const fieldInputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-auto sm:min-w-0';

  const thClass =
    'whitespace-nowrap px-4 py-4 text-center text-sm font-semibold text-slate-700 sm:px-5 first:pl-6 last:pr-6';

  const tdBase = 'px-4 py-3.5 text-center align-middle text-sm sm:px-5 first:pl-6 last:pr-6';

  function dashUnless(val, node) {
    if (val == null || (typeof val === 'string' && val.trim() === '')) {
      return <span className="text-slate-400">—</span>;
    }
    return node ?? val;
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/30 p-6 shadow-md shadow-indigo-950/[0.04] ring-1 ring-violet-100/50 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" aria-hidden />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600/90">Pipeline</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Leads</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
            {isViewer && 'View the full lead list. Filter by creator like admin (read-only — no add, import, or row actions).'}
            {isAgent && 'Work your assigned leads — edit details from the list.'}
            {isAdmin && 'Search, assign agents, and grow your hotel lead pipeline.'}
          </p>
        </div>
      </header>
          

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-3 sm:gap-y-3">
          <div className="flex min-w-0 w-full flex-col gap-1.5 sm:max-w-md sm:flex-1">
            <label htmlFor="lead-search-filter" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Search
            </label>
            <input
              id="lead-search-filter"
              type="search"
              name="lead-search-filter"
              autoComplete="off"
              placeholder="Property, contact, or phone…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:bg-white"
            />
          </div>
          {canFilterLeadsByCreator && (
            <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-44">
              <label htmlFor="leads-creator-users" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Users
              </label>
              <UiSelect
                id="leads-creator-users"
                aria-label="Filter leads by creator"
                className="sm:w-44"
                value={selectedCreatorId}
                onChange={(v) => {
                  setSelectedCreatorId(v);
                  setPage(1);
                }}
                options={creatorFilterOptions}
                disabled={userNamesLoading}
                placeholder="Loading users…"
              />
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
          <div className="hidden min-h-[1.125rem] shrink-0 lg:block" aria-hidden />
          <div className="flex flex-wrap items-center gap-2">
            {!isViewer && (
              <button
                type="button"
                onClick={() => {
                  downloadLeadsImportTemplate();
                  toast.success('Template downloaded. Use the same column names when importing.', {
                    title: 'Excel template',
                    duration: 3500,
                  });
                }}
                className="h-10 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-4 text-sm font-medium text-emerald-900 shadow-sm hover:border-emerald-300 hover:bg-emerald-50"
                title="Download a CSV file that opens in Excel with the columns your leads use (hotel, owner, phone, etc.) and one example row."
              >
                Download Excel template
              </button>
            )}
            {canCreateOrImport && (
              <>
                <button
                  type="button"
                  onClick={() => setImportModalOpen(true)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                >
                  Import CSV
                </button>
                <button type="button" onClick={openCreate} className="btn-primary-gradient h-10 rounded-xl px-4 text-sm font-semibold">
                  Add lead
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.03] ring-1 ring-slate-100/80">
        {loading ? (
          <PageLoader message="Loading leads…" className="py-16" size="md" />
        ) : leads.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-medium text-slate-800">No leads yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {isViewer ? 'No leads to display.' : 'Add a lead or import from CSV to get started.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full min-w-[48rem] border-collapse text-center">
                <caption className="sr-only">Hotel leads: property, contact, and pipeline details</caption>
                <thead>
                  <tr className="border-b border-indigo-200/50 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-violet-50/20">
                    <th scope="col" className={`${thClass} w-12 tabular-nums`}>
                      Sr. No.
                    </th>
                    <th scope="col" className={thClass}>Property</th>
                    <th scope="col" className={thClass}>Owner</th>
                    <th scope="col" className={thClass}>Phone</th>
                    <th scope="col" className={`${thClass} min-w-[10rem] whitespace-nowrap`}>Email</th>
                    <th scope="col" className={thClass}>Rooms</th>
                    <th scope="col" className={thClass}>Location</th>
                    {(isAdmin || isViewer) && <th scope="col" className={thClass}>Added</th>}
                    {(isAdmin || isAgent) && <th scope="col" className={thClass}>Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/90">
                  {leads.map((lead, i) => (
                    <tr
                      key={lead.id}
                      className="transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/35"
                    >
                      <td className={`${tdBase} w-12 tabular-nums text-slate-600`}>
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className={`${tdBase} font-semibold text-slate-900`}>
                        {dashUnless(lead.hotel_name?.trim(), lead.hotel_name)}
                      </td>
                      <td className={`${tdBase} text-slate-700`}>
                        {dashUnless(lead.owner_name?.trim(), lead.owner_name)}
                      </td>
                      <td className={`${tdBase} font-mono text-[13px] tracking-tight text-slate-800`}>
                        {dashUnless(lead.phone?.trim(), lead.phone)}
                      </td>
                      <td className={`${tdBase} whitespace-nowrap text-slate-600`}>
                        {dashUnless(
                          lead.email?.trim(),
                          <span className="font-normal text-[13px] text-slate-600" title={lead.email}>
                            {lead.email}
                          </span>,
                        )}
                      </td>
                      <td className={`${tdBase} tabular-nums text-slate-600`}>
                        {dashUnless(
                          lead.rooms != null && lead.rooms !== '' ? String(lead.rooms) : null,
                          lead.rooms,
                        )}
                      </td>
                      <td className={`${tdBase} text-slate-600`}>
                        {dashUnless(lead.location?.trim(), lead.location)}
                      </td>
                      {(isAdmin || isViewer) && (
                        <td className={`${tdBase} text-sm tabular-nums text-slate-500`}>
                          {formatDate(lead.created_at)}
                        </td>
                      )}
                      {(isAdmin || isAgent) && (
                        <td className={`${tdBase} py-3`}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(lead.id)}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-indigo-600 transition-colors hover:bg-indigo-50 hover:text-indigo-800 focus-visible:outline focus-visible:ring-2 focus-visible:ring-indigo-500/30"
                              aria-label={`Edit ${lead.hotel_name?.trim() || 'lead'}`}
                              title="Edit"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(lead.id)}
                              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-red-500/25"
                              aria-label={`Remove ${lead.hotel_name?.trim() || 'lead'}`}
                              title="Remove"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && leads.length > 0 && (
              <PaginationBar
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={PAGE_SIZE}
                onPage={setPage}
                disabled={loading}
                variant="full"
                size="compact"
                className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                summaryExtra={<span className="text-slate-400"> · {PAGE_SIZE} per page</span>}
              />
            )}
          </>
        )}
      </div>

      {formModal.open && canCreateOrImport && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 backdrop-blur-[2px]"
          role="presentation"
          onClick={closeForm}
        >
          <div className="flex min-h-[100dvh] items-start justify-center px-3 py-6 sm:items-center sm:px-4 sm:py-8">
            <div
              className="w-full max-w-xl rounded-xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15 ring-1 ring-slate-100"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lead-form-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 via-white to-violet-50/40 px-4 py-3 sm:px-5 sm:py-3.5">
                <div>
                  <h2 id="lead-form-title" className="text-base font-bold text-slate-900 sm:text-lg">
                    {formModal.lead?.id ? 'Edit lead' : 'Add lead'}
                  </h2>
                  <p className="mt-0 text-xs leading-snug text-slate-500 sm:text-[13px]">Saved to your pipeline.</p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="shrink-0 rounded-lg border border-slate-200/80 bg-white/90 p-1.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                  aria-label="Close"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-4 py-3.5 sm:px-5 sm:py-4">
                <LeadForm lead={formModal.lead} onSave={handleSave} onCancel={closeForm} saving={formSaving} />
              </div>
            </div>
          </div>
        </div>
      )}

      {importModalOpen && canCreateOrImport && (
        <ImportLeadsModal onImport={handleImport} onClose={() => setImportModalOpen(false)} importing={importing} />
      )}

      {deleteConfirm != null && canCreateOrImport && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/45 backdrop-blur-[2px]"
          role="presentation"
          onClick={() => { if (!deleteDeleting) setDeleteConfirm(null); }}
        >
          <div className="flex min-h-[100dvh] items-center justify-center px-4 py-8">
            <div
              className="w-full max-w-md rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-100 sm:p-6"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-lead-title"
              aria-describedby="delete-lead-desc"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <h2 id="delete-lead-title" className="mt-4 text-lg font-bold text-slate-900">
                Delete this lead?
              </h2>
              <p id="delete-lead-desc" className="mt-2 text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">
                  {leadPendingDelete?.hotel_name?.trim() || 'This lead'}
                </span>
                {' '}
                will be removed permanently. This cannot be undone.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={deleteDeleting}
                  onClick={() => setDeleteConfirm(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteDeleting}
                  onClick={() => handleDelete(deleteConfirm)}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteDeleting ? 'Deleting…' : 'Delete lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
