import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PaginationBar } from '../components/PaginationBar';
import PageLoader from '../components/PageLoader';
import { deleteScript, getScripts } from '../services/scriptsService';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';

const PAGE_SIZE = 10;

function safeList(res) {
  const data = res?.data ?? res;
  const list = Array.isArray(data?.scripts) ? data.scripts : (Array.isArray(data) ? data : []);
  const total = data?.total ?? data?.count ?? list.length;
  return { list, total };
}

export default function ScriptsPage() {
  const { user } = useAuth();
  const isViewer = getRole(user) === 'viewer';
  const [scripts, setScripts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      const res = await getScripts(params);
      const { list, total: t } = safeList(res);
      setScripts(list);
      setTotal(t);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load scripts');
      setScripts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  async function confirmDelete(id) {
    setError('');
    try {
      await deleteScript(id);
      setDeleteConfirmId(null);
      fetchScripts();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Delete failed');
    }
  }

  return (
    <div className="min-h-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Call Scripts</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isViewer ? 'View saved scripts. Editing and new scripts require an admin account.' : 'Build AI conversation flows and reuse them in campaigns.'}
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <input
              type="search"
              placeholder="Search scripts…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          {!isViewer && (
            <Link
              to="/dashboard/scripts/new"
              className="btn-primary-gradient inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none"
            >
              <svg className="w-5 h-5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New script
            </Link>
          )}
        </div>

        {loading ? (
          <PageLoader message="Loading scripts…" className="py-16" size="md" />
        ) : scripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-700 font-semibold">No scripts yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first script to start building conversation flows.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Steps</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {isViewer ? 'Edit' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scripts.map((s) => {
                  const steps = Array.isArray(s?.flow?.steps) ? s.flow.steps.length : (Array.isArray(s?.flow?.nodes) ? s.flow.nodes.length : '—');
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">{s.name || `Script ${s.id}`}</p>
                          <p className="truncate text-xs text-slate-500">ID: {s.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{steps}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          {!isViewer && (
                            <Link
                              to={`/dashboard/scripts/${s.id}`}
                              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                            >
                              Open
                            </Link>
                          )}
                          {isViewer ? (
                            <span className="text-xs text-slate-400">—</span>
                          ) : deleteConfirmId === s.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => confirmDelete(s.id)}
                                className="rounded-lg px-2.5 py-1.5 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(s.id)}
                              className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalCount={total}
            pageSize={PAGE_SIZE}
            onPage={setPage}
            disabled={loading}
            variant="simple"
            className="flex flex-col gap-3 border-t border-slate-100 px-6 py-3 sm:flex-row sm:items-center sm:justify-between"
          />
        )}
      </div>
    </div>
  );
}

