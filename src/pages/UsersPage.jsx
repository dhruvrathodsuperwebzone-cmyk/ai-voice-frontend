import { useState, useEffect, useCallback } from 'react';
import { PaginationBar } from '../components/PaginationBar';
import UiSelect from '../components/UiSelect';
import PageLoader from '../components/PageLoader';
import { getUsers, normalizeUsersList, createUser } from '../services/usersService';
import CreateUserModal from '../components/CreateUserModal';
import { useToast } from '../store/toastContext';
import { useAuth } from '../store/authContext';
import { isViewer } from '../utils/roleUtils';

const PAGE_SIZE = 20;

const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'agent', label: 'Agent' },
  { value: 'viewer', label: 'Viewer' },
];

/** Matches admin agent cards on AgentsPage */
const userCardClass =
  'group flex min-h-0 flex-col overflow-hidden rounded-2xl border border-violet-200/45 bg-gradient-to-br from-white via-white to-violet-50/40 shadow-md shadow-indigo-950/[0.06] ring-1 ring-violet-100/40 transition-[box-shadow,transform] hover:shadow-lg hover:shadow-indigo-950/[0.08]';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-shadow disabled:opacity-70';

function RolePill({ role }) {
  const r = (role || '—').toLowerCase();
  const styles = {
    admin: 'border-violet-200 bg-violet-50 text-violet-800',
    agent: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    viewer: 'border-slate-200 bg-slate-50 text-slate-600',
  };
  const c = styles[r] || 'border-slate-200 bg-slate-50 text-slate-700';
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${c}`}>{role || '—'}</span>
  );
}

export default function UsersPage() {
  const toast = useToast();
  const { user } = useAuth();
  const viewerMode = isViewer(user);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      const res = await getUsers(params);
      const { users: list, total: t } = normalizeUsersList(res);
      setUsers(list);
      setTotal(typeof t === 'number' ? t : list.length);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load users';
      setError(msg);
      toast.error(msg, { title: 'Users load failed' });
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleCreateUser(payload) {
    setCreateSaving(true);
    try {
      await createUser(payload);
      await fetchUsers();
      toast.success('User created successfully.', { title: 'Success' });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create user';
      toast.error(msg, { title: 'Create user failed' });
      throw err;
    } finally {
      setCreateSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil((total || users.length) / PAGE_SIZE));
  const totalCount = total > 0 ? total : users.length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/30 p-6 shadow-md shadow-indigo-950/[0.04] ring-1 ring-violet-100/50">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-36 w-56 rounded-full bg-indigo-400/15 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600/90">Users</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Team &amp; access</h1>
            <p className="mt-1 text-xs font-medium text-indigo-700/90">
              <span className="text-slate-600">
                {viewerMode ? 'Directory is read-only for your role.' : 'Admins, agents, and viewers in your workspace.'}
              </span>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{totalCount}</span> user{totalCount === 1 ? '' : 's'} total.
            </p>
          </div>
          {!viewerMode && (
            <div className="flex max-w-full flex-col items-stretch gap-2 sm:max-w-md sm:items-end">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="btn-primary-gradient w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md shadow-indigo-900/10 sm:w-auto"
              >
                + Add user
              </button>
            </div>
          )}
        </div>
      </header>

      {createModalOpen && !viewerMode && (
        <CreateUserModal
          onClose={() => !createSaving && setCreateModalOpen(false)}
          onCreated={handleCreateUser}
          saving={createSaving}
        />
      )}

      {error && (
        <div className="flex gap-3 rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900 shadow-sm ring-1 ring-red-100/60" role="alert">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.03] ring-1 ring-slate-100/80">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">Directory</h2>
            <p className="mt-1 text-sm text-slate-600">Search by name or email, filter by role, then refresh after changes.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
            <input
              type="search"
              id="users-search"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={`${inputClass} sm:min-w-[14rem] sm:max-w-xs`}
            />
            <UiSelect
              id="users-role-filter"
              aria-label="Filter users by role"
              className="w-full sm:w-44"
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v);
                setPage(1);
              }}
              options={ROLE_FILTER_OPTIONS}
              placeholder="All roles"
            />
            <button
              type="button"
              onClick={() => fetchUsers()}
              className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50/80"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <PageLoader message="Loading users…" className="py-16" size="md" />
        ) : users.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-semibold text-slate-900">No users on this page</p>
            <p className="mt-2 text-sm text-slate-500">Try another page, clear filters, or add a user to get started.</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Users">
              {users.map((u, idx) => {
                const id = u.id ?? u._id;
                const name = (u.name || '').trim() || 'Unnamed user';
                const email = u.email ?? '—';
                const phone = u.phone != null && u.phone !== '' ? String(u.phone) : '';
                const rowKey = id != null ? String(id) : `user-${email}-${idx}`;

                return (
                  <li key={rowKey} className={userCardClass}>
                    <div className="h-1 w-full shrink-0 bg-gradient-to-r from-violet-500/75 via-indigo-500/65 to-violet-400/55" aria-hidden />

                    <div className="flex flex-1 flex-col p-5 pt-4">
                      <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-900" title={name}>
                        {name}
                      </h3>
                      <p className="mt-2 break-all text-sm text-slate-600" title={email}>
                        {email}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <RolePill role={u.role} />
                      </div>

                      <div className="mt-4 space-y-3 rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm ring-1 ring-slate-100/80">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Phone</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{phone || '—'}</p>
                        </div>
                      </div>

                      {id != null ? (
                        <p className="mt-4 text-center font-mono text-[10px] text-slate-400">Reference #{id}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {!loading && users.length > 0 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPage={setPage}
            disabled={loading}
          />
        )}
      </div>
    </div>
  );
}
