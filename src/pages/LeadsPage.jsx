import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import {
  getLeads,
  getAllLeads,
  getLeadById,
  createLead,
  updateLead,
  assignAgentToLead,
  deleteLead,
  importLeads,
} from '../services/leadsService';
import LeadForm from '../components/LeadForm';
import ImportLeadsModal from '../components/ImportLeadsModal';
import { getUsers, normalizeUsersList } from '../services/usersService';
import { useToast } from '../store/toastContext';

const STATUS_OPTIONS = ['', 'new', 'contacted', 'qualified', 'converted', 'lost', 'not_interested'];
const AGENT_STATUS_OPTIONS = ['interested', 'not_interested', 'callback'];
const PAGE_SIZES = [10, 25, 50, 100];

/** Filter dropdown + badge copy for pipeline stages */
const PIPELINE_STAGE_LABEL = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost: 'Lost',
  not_interested: 'Not interested',
};

/** Agent outcome dropdown labels */
const AGENT_OUTCOME_LABEL = {
  interested: 'Interested',
  not_interested: 'Not interested',
  callback: 'Callback needed',
};
const DEFAULT_PAGE_SIZE = 10;

function formatDate(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toLocaleDateString();
  } catch {
    return val;
  }
}

const STATUS_BADGE_STYLES = {
  new: 'bg-sky-50 text-sky-800 ring-sky-200/80',
  contacted: 'bg-violet-50 text-violet-800 ring-violet-200/80',
  qualified: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  converted: 'bg-indigo-50 text-indigo-800 ring-indigo-200/80',
  lost: 'bg-slate-100 text-slate-700 ring-slate-200/80',
  not_interested: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  interested: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  callback: 'bg-orange-50 text-orange-900 ring-orange-200/80',
};

function StatusBadge({ status }) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  const style = STATUS_BADGE_STYLES[key] || 'bg-slate-100 text-slate-700 ring-slate-200/60';
  const label =
    PIPELINE_STAGE_LABEL[key] ||
    AGENT_OUTCOME_LABEL[key] ||
    (status ? String(status).replace(/_/g, ' ') : null);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {label || '—'}
    </span>
  );
}

export default function LeadsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const role = getRole(user);
  const isViewer = role === 'viewer';
  const isAgent = role === 'agent';
  const isAdmin = role === 'admin';

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formModal, setFormModal] = useState({ open: false, lead: null });
  const [formSaving, setFormSaving] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteDeleting, setDeleteDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [notesEdit, setNotesEdit] = useState({}); // id -> notes text
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [assigningId, setAssigningId] = useState(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const hasFilters = !!search.trim() || !!statusFilter;
      const useAllForAdmin = isAdmin && !hasFilters;

      let data;
      if (useAllForAdmin) {
        const res = await getAllLeads();
        data = res?.data ?? res;
      } else {
        const params = { page, limit: pageSize };
        if (search.trim()) params.search = search.trim();
        if (statusFilter) params.status = statusFilter;
        // Optional: if (isAgent) params.assigned = true; — backend can filter assigned leads
        const res = await getLeads(params);
        data = res?.data ?? res;
      }
      const list = Array.isArray(data?.leads) ? data.leads : (Array.isArray(data) ? data : []);
      setLeads(list);
      const apiTotal =
        data?.total ??
        data?.count ??
        data?.pagination?.total ??
        data?.pagination?.count ??
        data?.pagination?.total_count ??
        data?.meta?.total ??
        list.length;
      const normalizedTotal = Number(apiTotal);
      setTotal(Number.isFinite(normalizedTotal) && normalizedTotal >= 0 ? normalizedTotal : list.length);

      const pageFromApi = Number(data?.pagination?.page ?? page);
      const limitFromApi = Number(data?.pagination?.limit ?? pageSize);
      const hasNextFromApi = data?.pagination?.hasNext ?? data?.pagination?.has_next;
      const computedHasNext =
        typeof hasNextFromApi === 'boolean'
          ? hasNextFromApi
          : (Number.isFinite(normalizedTotal) && normalizedTotal > 0
              ? pageFromApi * limitFromApi < normalizedTotal
              : list.length >= pageSize);
      setHasNextPage(useAllForAdmin ? false : computedHasNext);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load leads');
      setLeads([]);
      setTotal(0);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, isAgent]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const fetchAgents = useCallback(async () => {
    if (!isAdmin) return;
    setAgentsLoading(true);
    try {
      const res = await getUsers({ page: 1, limit: 200, role: 'agent' });
      const { users: list } = normalizeUsersList(res);
      setAgents(list);
    } catch (err) {
      // don't block lead list; show assignment dropdown without options
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

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
      const editing = !!formModal.lead?.id;
      if (editing) await updateLead(formModal.lead.id, payload);
      else await createLead(payload);
      closeForm();
      // Keep the list unfiltered after save so newly saved items are visible.
      setSearch('');
      setStatusFilter('');
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
      await deleteLead(id);
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

  async function handleAssignAgent(leadId, agentId) {
    setError('');
    try {
      await assignAgentToLead(leadId, agentId);
      await fetchLeads();
      toast.success('Agent assigned successfully.', { title: 'Success' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Assign failed';
      setError(msg);
      toast.error(msg, { title: 'Assign failed' });
    } finally {
      setAssigningId(null);
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

  async function handleAgentStatusChange(leadId, newStatus) {
    setUpdatingId(leadId);
    setError('');
    try {
      await updateLead(leadId, { status: newStatus });
      fetchLeads();
      toast.success('Lead outcome updated.', { title: 'Success', duration: 2200 });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Update failed';
      setError(msg);
      toast.error(msg, { title: 'Update failed' });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleAgentNotesSave(leadId, notes) {
    setUpdatingId(leadId);
    setError('');
    try {
      await updateLead(leadId, { notes });
      setNotesEdit((prev) => ({ ...prev, [leadId]: undefined }));
      fetchLeads();
      toast.success('Notes saved.', { title: 'Success', duration: 2000 });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Update failed';
      setError(msg);
      toast.error(msg, { title: 'Update failed' });
    } finally {
      setUpdatingId(null);
    }
  }

  const leadPendingDelete =
    deleteConfirm != null ? leads.find((l) => String(l.id) === String(deleteConfirm)) : null;

  const totalCount = total > 0 ? total : leads.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  const canCreateOrImport = isAdmin || isAgent;
  const viewerColumnsOnly = isViewer;

  const fieldInputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-auto sm:min-w-0';

  const cellSelectClass =
    'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50';

  const notesInputClass =
    'w-full max-w-[220px] rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20';

  const thClass =
    'whitespace-nowrap px-4 py-4 text-left text-sm font-semibold text-slate-700 sm:px-5 first:pl-6 last:pr-6';

  const tdBase = 'px-4 py-3.5 align-middle text-sm sm:px-5 first:pl-6 last:pr-6';

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
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600/90">Pipeline</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Leads</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              {isViewer && 'View the lead list. Read-only access.'}
              {isAgent && 'Work your assigned leads — update status and capture notes in one place.'}
              {isAdmin && 'Search, filter, assign agents, and grow your hotel lead pipeline.'}
            </p>
          </div>
          
        </div>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100/80 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <input
            type="search"
            name="lead-search-filter"
            autoComplete="off"
            placeholder="Search property, contact, or phone…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-full sm:max-w-md sm:bg-white"
          />
          <select
            name="lead-status-filter"
            autoComplete="off"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`${fieldInputClass} cursor-pointer rounded-xl border-slate-200 bg-slate-50/80 sm:bg-white`}
          >
            {(isAgent ? ['', ...AGENT_STATUS_OPTIONS] : STATUS_OPTIONS).map((s) => {
              const label = isAgent
                ? (s ? AGENT_OUTCOME_LABEL[s] || s : 'All outcomes')
                : (s ? PIPELINE_STAGE_LABEL[s] || s : 'All stages');
              return <option key={s || 'all'} value={s}>{label}</option>;
            })}
          </select>
        </div>
        {canCreateOrImport && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
            >
              Import CSV
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary-gradient rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              Add lead
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.03] ring-1 ring-slate-100/80">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-600">Loading leads…</p>
          </div>
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
              <table className="w-full min-w-[52rem] border-collapse text-left">
                <caption className="sr-only">Hotel leads: property, contact, and pipeline details</caption>
                <thead>
                  <tr className="border-b border-indigo-200/50 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-violet-50/20">
                    <th scope="col" className={thClass}>Property</th>
                    <th scope="col" className={thClass}>Contact</th>
                    <th scope="col" className={thClass}>Phone</th>
                    {!viewerColumnsOnly && (
                      <th scope="col" className={`${thClass} min-w-[10rem] whitespace-nowrap`}>Email</th>
                    )}
                    {!viewerColumnsOnly && <th scope="col" className={thClass}>Rooms</th>}
                    <th scope="col" className={thClass}>Location</th>
                    <th scope="col" className={thClass}>{isAgent ? 'Outcome' : 'Stage'}</th>
                    {isAgent && <th scope="col" className={thClass}>Call notes</th>}
                    {!viewerColumnsOnly && <th scope="col" className={thClass}>Added</th>}
                    {isAdmin && <th scope="col" className={`${thClass} text-right`}>Assign &amp; manage</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/90">
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="transition-colors odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/35"
                    >
                      <td className={`${tdBase} font-semibold text-slate-900`}>
                        {dashUnless(lead.hotel_name?.trim(), lead.hotel_name)}
                      </td>
                      <td className={`${tdBase} text-slate-700`}>
                        {dashUnless(lead.owner_name?.trim(), lead.owner_name)}
                      </td>
                      <td className={`${tdBase} font-mono text-[13px] tracking-tight text-slate-800`}>
                        {dashUnless(lead.phone?.trim(), lead.phone)}
                      </td>
                      {!viewerColumnsOnly && (
                        <td className={`${tdBase} whitespace-nowrap text-slate-600`}>
                          {dashUnless(
                            lead.email?.trim(),
                            <span className="font-normal text-[13px] text-slate-600" title={lead.email}>
                              {lead.email}
                            </span>,
                          )}
                        </td>
                      )}
                      {!viewerColumnsOnly && (
                        <td className={`${tdBase} tabular-nums text-slate-600`}>
                          {dashUnless(
                            lead.rooms != null && lead.rooms !== '' ? String(lead.rooms) : null,
                            lead.rooms,
                          )}
                        </td>
                      )}
                      <td className={`${tdBase} text-slate-600`}>
                        {dashUnless(lead.location?.trim(), lead.location)}
                      </td>
                      <td className={`${tdBase}`}>
                        {isAgent ? (
                          <select
                            value={lead.status || ''}
                            onChange={(e) => handleAgentStatusChange(lead.id, e.target.value)}
                            disabled={updatingId === lead.id}
                            className={cellSelectClass}
                          >
                            {AGENT_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{AGENT_OUTCOME_LABEL[opt] || opt}</option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge status={lead.status} />
                        )}
                      </td>
                      {isAgent && (
                        <td className={`${tdBase} py-3`}>
                          <input
                            type="text"
                            placeholder="Notes after call…"
                            value={notesEdit[lead.id] !== undefined ? notesEdit[lead.id] : (lead.notes ?? '')}
                            onChange={(e) => setNotesEdit((p) => ({ ...p, [lead.id]: e.target.value }))}
                            onBlur={(e) => {
                              const v = e.target.value?.trim();
                              if (v !== (lead.notes ?? '')) handleAgentNotesSave(lead.id, v || '');
                            }}
                            className={notesInputClass}
                          />
                        </td>
                      )}
                      {!viewerColumnsOnly && (
                        <td className={`${tdBase} text-sm tabular-nums text-slate-500`}>
                          {formatDate(lead.created_at)}
                        </td>
                      )}
                      {isAdmin && (
                        <td className={`${tdBase} py-3 text-right`}>
                          <div className="flex flex-col items-end gap-2">
                            <label className="sr-only" htmlFor={`assign-${lead.id}`}>Assign agent</label>
                            <select
                              id={`assign-${lead.id}`}
                              value={
                                lead.agent_id ?? lead.assigned_agent_id ?? lead.agentId ?? lead.assigned_to ?? ''
                              }
                              onChange={(e) => {
                                const agentId = e.target.value;
                                if (!agentId) return;
                                setAssigningId(lead.id);
                                handleAssignAgent(lead.id, agentId);
                              }}
                              disabled={agentsLoading || assigningId === lead.id}
                              className={`${cellSelectClass} min-w-[10rem] text-left`}
                            >
                              <option value="">Choose agent…</option>
                              {agents.map((a) => (
                                <option key={a.id ?? a._id ?? a.email} value={a.id ?? a._id}>
                                  {a.name || a.email}
                                </option>
                              ))}
                            </select>

                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(lead.id)}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100/80"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm(lead.id)}
                                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-700"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {!loading && (leads.length > 0 || total > 0) && totalPages >= 1 && (
        <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm text-slate-600">
              Showing <strong className="font-semibold text-slate-900">{startRow}-{endRow}</strong> of{' '}
              <strong className="font-semibold text-slate-900">{totalCount}</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Per page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              First
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              Previous
            </button>
            <span
              className="btn-primary-gradient flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg px-3 text-sm font-semibold"
              aria-current="page"
            >
              {page}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || (!hasNextPage && page >= totalPages)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              Next
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
            >
              Last
            </button>
          </div>
        </div>
      )}

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

      {deleteConfirm != null && isAdmin && (
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
