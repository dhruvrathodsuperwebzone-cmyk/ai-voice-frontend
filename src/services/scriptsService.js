import { api } from './apiClient';

/**
 * POST /scripts — create script
 */
export async function createScript(payload) {
  const { data } = await api.post('/scripts', payload);
  return data;
}

/**
 * GET /scripts — list scripts
 */
export async function getScripts(params = {}) {
  const { data } = await api.get('/scripts', { params });
  return data;
}

/**
 * GET /scripts/:id — get one (optional)
 */
export async function getScriptById(id) {
  const { data } = await api.get(`/scripts/${id}`);
  return data;
}

/**
 * PUT /scripts/:id — update
 */
export async function updateScript(id, payload) {
  const { data } = await api.put(`/scripts/${id}`, payload);
  return data;
}

/**
 * DELETE /scripts/:id — delete
 */
export async function deleteScript(id) {
  const { data } = await api.delete(`/scripts/${id}`);
  return data;
}

/**
 * GET /scripts/names — fetch scripts as a compact list for dropdowns.
 * Expected shape examples:
 * - [ { id, name }, ... ]
 * - { scripts: [ { id, name }, ... ] }
 */
export async function getScriptNames() {
  const { data } = await api.get('/scripts/names');
  return data;
}
