import { api } from './apiClient';

/**
 * GET /leads — list with search, filters, pagination
 * @param {Object} params - { page, limit, search, status, ... }
 */
export async function getLeads(params = {}) {
  const { data } = await api.get('/leads', { params });
  return data;
}

/**
 * GET /leads/by-creator — admin: leads for one creator (query: page, limit, search?, …).
 * Server requires one of: user_id, userId, creator_id. For “all creators”, use getLeads() instead.
 */
export async function getLeadsByCreator(params = {}) {
  const { data } = await api.get('/leads/by-creator', {
    params,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return data;
}

/**
 * GET /leads/all — list all leads (admin view)
 */
export async function getAllLeads() {
  const { data } = await api.get('/leads/all');
  return data;
}

/**
 * GET /leads/:id
 */
export async function getLeadById(id) {
  const { data } = await api.get(`/leads/${id}`);
  return data;
}

/**
 * POST /leads — create lead
 */
export async function createLead(payload) {
  const { data } = await api.post('/leads', payload);
  return data;
}

/**
 * PUT /leads/:id — update lead
 */
export async function updateLead(id, payload) {
  const { data } = await api.put(`/leads/${id}`, payload);
  return data;
}

/**
 * PUT /api/leads/admin/:id — admin updates any lead (Bearer JWT).
 * Body example: { hotel_name, owner_name, phone, location, status, … }
 */
export async function updateLeadAsAdmin(id, payload) {
  const { data } = await api.put(`/leads/admin/${id}`, payload);
  return data;
}

/**
 * PUT /leads/:id/assign-agent — assign lead to an agent (admin)
 * Body: { agent_id: number|string }
 */
export async function assignAgentToLead(id, agentId) {
  const { data } = await api.put(`/leads/${id}/assign-agent`, { agent_id: agentId });
  return data;
}

/**
 * DELETE /leads/:id
 */
export async function deleteLead(id) {
  const { data } = await api.delete(`/leads/${id}`);
  return data;
}

/**
 * DELETE /leads/admin/:id — admin: delete any lead
 */
export async function deleteLeadAsAdmin(id) {
  const { data } = await api.delete(`/leads/admin/${id}`);
  return data;
}

/**
 * POST /voice/bulk-call/upload — bulk upload CSV/Excel for voice campaign
 * FormData fields:
 * - file
 * - name
 * - is_scheduled
 * - phone_number_id
 * - agent_id (outbound voice agent for the bulk campaign)
 */
export async function importLeads(formData) {
  const { data } = await api.post('/voice/bulk-call/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
