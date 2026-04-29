import { api } from './apiClient';

/**
 * GET /calls/outbound/agents
 * Returns available agents for outbound calls.
 */
export async function getOutboundCallAgents() {
  const { data } = await api.get('/calls/outbound/agents');
  return data;
}

/**
 * GET /calls/outbound/admin/agents
 * Admin-only: outbound agents (Bearer admin JWT).
 */
export async function getOutboundAdminAgents() {
  const { data } = await api.get('/calls/outbound/admin/agents', {
    headers: { Accept: 'application/json' },
  });
  return data;
}

/**
 * GET /calls/outbound/agents/all
 * Admin-only: full outbound agent list for Calls page dropdown (Bearer admin JWT).
 */
export async function getOutboundAgentsAll() {
  const { data } = await api.get('/calls/outbound/agents/all', {
    headers: { Accept: 'application/json' },
  });
  return data;
}

/** Parses GET /calls/outbound/agents or .../agents/all JSON into an agent object array. */
export function normalizeOutboundAgentsList(res) {
  const body = res?.data ?? res;
  const list =
    body?.agents ??
    body?.items ??
    body?.data ??
    (Array.isArray(body) ? body : []);
  return Array.isArray(list) ? list : [];
}

/**
 * GET /calls/outbound/requests?page=&limit=
 * Same as: GET {API_BASE}/api/calls/outbound/requests?page=1&limit=10 (query string; not body).
 */
export async function getOutboundRequests(params = { page: 1, limit: 10 }) {
  const { data } = await api.get('/calls/outbound/requests', {
    params,
    headers: { Accept: 'application/json' },
  });
  return data;
}

/**
 * GET /calls/outbound/requests/:id
 */
export async function getOutboundRequestById(id) {
  const { data } = await api.get(`/calls/outbound/requests/${encodeURIComponent(String(id))}`, {
    headers: { Accept: 'application/json' },
  });
  return data;
}

/**
 * POST /calls/outbound
 * Body: { name, phone, agent_id } — optional: email, location (when supported by API)
 */
export async function makeOutboundCall(payload) {
  const { data } = await api.post('/calls/outbound', payload);
  return data;
}


export async function makeOutboundCsvCall({ agent_id, file }) {
  const formData = new FormData();
  formData.append('agent_id', String(agent_id));
  const fileForUpload =
    file.type && file.type !== 'application/octet-stream'
      ? file
      : new File([file], file.name, { type: 'text/csv' });
  formData.append('file', fileForUpload, fileForUpload.name);

  const { data } = await api.post('/calls/outbound/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

