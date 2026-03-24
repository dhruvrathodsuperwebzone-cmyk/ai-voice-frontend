import { useState, useEffect, useCallback } from 'react';
import { getUsers, normalizeUsersList, createUser } from '../services/usersService';
import CreateUserModal from '../components/CreateUserModal';
import { useToast } from '../store/toastContext';

const PAGE_SIZES = [10, 20, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 20;

function RolePill({ role }) {
  const r = (role || '—').toLowerCase();
  const styles = {
    admin: 'bg-violet-100 text-violet-800',
    agent: 'bg-indigo-100 text-indigo-800',
    viewer: 'bg-slate-100 text-slate-600',
  };
  const c = styles[r] || 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{role || '—'}</span>;
}

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: pageSize };
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
  }, [page, pageSize, search, roleFilter, toast]);

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

  const totalPages = Math.max(1, Math.ceil((total || users.length) / pageSize));
  const totalCount = total > 0 ? total : users.length;
  const startRow = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRow = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 flex-1 min-w-0">
          <input
            type="search"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full sm:max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary-gradient rounded-lg px-3 py-2 text-sm font-medium"
          >
            + Add user
          </button>
          <button
            type="button"
            onClick={() => fetchUsers()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {createModalOpen && (
        <CreateUserModal
          onClose={() => !createSaving && setCreateModalOpen(false)}
          onCreated={handleCreateUser}
          saving={createSaving}
        />
      )}

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id ?? u._id ?? u.email} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{u.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{u.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <RolePill role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.phone != null && u.phone !== '' ? u.phone : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <span>
            {totalCount === 0 ? '0 users' : `Showing ${startRow}–${endRow} of ${totalCount}`}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1 text-xs">
              Rows
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded border border-slate-300 px-2 py-1 text-sm"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs px-2">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
