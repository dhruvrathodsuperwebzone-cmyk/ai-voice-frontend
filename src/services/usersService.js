import { api } from './apiClient';

/**
 * @param {*} raw - response body from GET /users
 * @returns {{ users: object[], total: number }}
 */
export function normalizeUsersList(raw) {
  const body = raw?.data !== undefined && !Array.isArray(raw) ? raw.data : raw;
  if (Array.isArray(body)) {
    return { users: body, total: body.length };
  }
  if (Array.isArray(body?.users)) {
    return {
      users: body.users,
      total: body.total ?? body.count ?? body.users.length,
    };
  }
  if (Array.isArray(body?.data)) {
    return {
      users: body.data,
      total: body.total ?? body.count ?? body.data.length,
    };
  }
  return { users: [], total: 0 };
}

/**
 * GET /api/users — list users (admin)
 */
export async function getUsers(params = {}) {
  const { data } = await api.get('/users', { params });
  return data;
}

/**
 * Normalizes GET /users/names for dropdowns: [{ id, name }, ...]
 */
export function normalizeUserNamesList(raw) {
  const body = raw?.data !== undefined && !Array.isArray(raw) ? raw.data : raw;
  if (!body) return [];
  if (Array.isArray(body)) {
    return body.map((item, i) => {
      if (typeof item === 'string') {
        const name = item.trim();
        return { id: `n-${i}-${name}`, name: name || `User ${i + 1}` };
      }
      const name = String(item?.name ?? item?.username ?? item?.email ?? '').trim();
      return {
        id: item?.id ?? item?.user_id ?? item?._id ?? `n-${i}`,
        name: name || `User ${i + 1}`,
      };
    });
  }
  if (Array.isArray(body?.names)) {
    return body.names.map((n, i) => ({
      id: `n-${i}`,
      name: String(n ?? '').trim() || `User ${i + 1}`,
    }));
  }
  if (Array.isArray(body?.users)) {
    return body.users.map((u, i) => ({
      id: u?.id ?? u?.user_id ?? u?._id ?? `n-${i}`,
      name: String(u?.name ?? u?.username ?? u?.email ?? '').trim() || `User ${i + 1}`,
    }));
  }
  return [];
}

/**
 * GET /api/users/names — compact user list (admin; backend enforces role).
 */
export async function getUserNames() {
  const { data } = await api.get('/users/names', {
    headers: { Accept: 'application/json' },
  });
  return data;
}

/**
 * POST /api/users — create user (admin).
 * Body matches public register: { name, email, password, role?, phone? }.
 * Password should be hashed the same way as /api/register if your API expects a client hash.
 */
export async function createUser(payload) {
  const { data } = await api.post('/users', payload);
  return data;
}
