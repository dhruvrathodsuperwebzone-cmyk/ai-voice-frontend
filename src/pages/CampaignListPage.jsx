import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import { PaginationBar } from '../components/PaginationBar';
import { getCampaigns, deleteCampaign } from '../services/campaignsService';
import { getScriptNames } from '../services/scriptsService';
import CampaignTable from '../components/campaigns/CampaignTable';
import UiSelect from '../components/UiSelect';
import PageLoader from '../components/PageLoader';

const PAGE_SIZES = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

export default function CampaignListPage() {
  const { user } = useAuth();
  const role = getRole(user);
  const isAdmin = role === 'admin';

  const pageSizeOptions = useMemo(
    () => PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) })),
    [],
  );

  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [scriptNamesById, setScriptNamesById] = useState({});

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: pageSize };
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      const res = await getCampaigns(params);
      const data = res?.data ?? res;
      const list = Array.isArray(data?.campaigns) ? data.campaigns : (Array.isArray(data) ? data : []);
      setCampaigns(list);
      setTotal(data?.total ?? data?.count ?? list.length);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load campaigns');
      setCampaigns([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    let cancelled = false;
    getScriptNames()
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (Array.isArray(res?.scripts) ? res.scripts : []);
        const map = {};
        list.forEach((s) => {
          const id = s?.id ?? s?.script_id ?? s?.scriptId;
          if (id == null) return;
          map[String(id)] = s?.name ?? s?.title ?? `Script ${id}`;
        });
        setScriptNamesById(map);
      })
      .catch(() => {
        if (!cancelled) setScriptNamesById({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConfirmDelete(id) {
    setError('');
    try {
      await deleteCampaign(id);
      setDeleteConfirmId(null);
      fetchCampaigns();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalCount = total > 0 ? total : campaigns.length;

  const fieldInputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:w-auto sm:min-w-0 sm:bg-white';

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/30 p-6 shadow-md shadow-indigo-950/[0.04] ring-1 ring-violet-100/50 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-violet-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-indigo-400/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600/90">Outbound</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Campaigns</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
              Create and manage AI calling campaigns, schedules, and assigned leads.
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100/80 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <input
            type="search"
            placeholder="Search campaigns…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:max-w-md sm:bg-white"
          />
          <UiSelect
            id="campaigns-status-filter"
            aria-label="Filter campaigns by status"
            className="w-full sm:max-w-[14rem]"
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            options={STATUS_FILTERS.map(({ value, label }) => ({ value: String(value), label }))}
            placeholder="All statuses"
          />
        </div>
        {isAdmin && (
          <Link
            to="/dashboard/campaigns/new"
            className="btn-primary-gradient inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <svg className="h-5 w-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New campaign
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.03] ring-1 ring-slate-100/80">
        {loading ? (
          <PageLoader message="Loading campaigns…" className="py-16" size="md" />
        ) : (
          <CampaignTable
            campaigns={campaigns}
            scriptNamesById={scriptNamesById}
            onDelete={isAdmin ? setDeleteConfirmId : undefined}
            deleteConfirmId={deleteConfirmId}
            onConfirmDelete={handleConfirmDelete}
            onCancelDelete={() => setDeleteConfirmId(null)}
          />
        )}
      </div>

      {!loading && (campaigns.length > 0 || total > 0) && totalPages >= 1 && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          onPage={setPage}
          disabled={loading}
          className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
          beforeNav={
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Per page</span>
              <UiSelect
                id="campaigns-page-size"
                aria-label="Rows per page"
                className="w-[5.5rem]"
                value={String(pageSize)}
                onChange={(v) => {
                  setPageSize(Number(v));
                  setPage(1);
                }}
                options={pageSizeOptions}
                placeholder="10"
              />
            </div>
          }
        />
      )}
    </div>
  );
}
