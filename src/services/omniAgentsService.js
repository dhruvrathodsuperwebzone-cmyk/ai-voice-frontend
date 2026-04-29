import { api } from './apiClient';

/**
 * POST /omni/agents
 * Creates an omni agent with:
 * - name
 * - welcome_message
 * - context_breakdown: [{ title, body, is_enabled }]
 */
export async function createOmniAgent(payload) {
  const { data } = await api.post('/omni/agents', payload);
  return data;
}

/**
 * GET /omni/agents
 * Returns a paginated list of omni agents.
 */
export async function getOmniAgents({ page = 1, page_size = 10 } = {}) {
  const { data } = await api.get('/omni/agents', { params: { page, page_size } });
  return data;
}

/**
 * GET /omni/admin/omnidim-agents
 * Admin-only: paginated omnidim bots ({ data: { bots, total_records }, pagination }).
 */
export async function getAdminOmnidimAgents({ page = 1, page_size = 10 } = {}) {
  const { data } = await api.get('/omni/admin/omnidim-agents', { params: { page, page_size } });
  return data;
}

/**
 * DELETE /omni/admin/agents/:id
 * Same id as GET/PATCH (e.g. external id 149450).
 */
export async function deleteAdminOmniAgent(id) {
  const { data } = await api.delete(`/omni/admin/agents/${encodeURIComponent(String(id))}`);
  return data;
}

/**
 * GET /omni/admin/agents/:id
 * `id` is often the Omnidim external id (e.g. 149450), not the workspace row id.
 */
export async function getAdminOmniAgent(id) {
  const { data } = await api.get(`/omni/admin/agents/${encodeURIComponent(String(id))}`);
  return data;
}

/**
 * PATCH /omni/admin/agents/:id
 */
export async function patchAdminOmniAgent(id, payload) {
  const { data } = await api.patch(`/omni/admin/agents/${encodeURIComponent(String(id))}`, payload);
  return data;
}

/**
 * PUT /omni/agents/:id — non-admin agent edit (context sections only in UI).
 */
export async function updateOmniAgent(id, payload) {
  const { data } = await api.put(`/omni/agents/${id}`, payload);
  return data;
}

/**
 * DELETE /omni/agents/:id
 */
export async function deleteOmniAgent(id) {
  const { data } = await api.delete(`/omni/agents/${id}`);
  return data;
}

