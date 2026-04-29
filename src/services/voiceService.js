import { api } from './apiClient';

/**
 * Prefer external id for GET /voice/agents/:id/calls when the backend expects it (e.g. 135636).
 * Tries common field names, then falls back to internal id.
 */
export function agentIdForVoiceCallsApi(agent) {
  if (!agent || typeof agent !== 'object') return '';
  const ext =
    agent.external_id ??
    agent.externalId ??
    agent.agent_external_id ??
    agent.external_agent_id;
  if (ext != null && String(ext).trim() !== '') return String(ext).trim();
  const id = agent.id ?? agent.agent_id ?? agent._id;
  return id != null && String(id).trim() !== '' ? String(id) : '';
}

export async function getVoiceCalls(params = {}) {
  const { data } = await api.get('/voice/calls', { params });
  return data;
}

/**
 * GET /voice/calls/:id — same as GET {origin}/api/voice/calls/2782034
 */
export async function getVoiceCallById(id) {
  const { data } = await api.get(`/voice/calls/${encodeURIComponent(String(id))}`, {
    headers: { Accept: 'application/json' },
  });
  return data;
}

/**
 * GET /voice/agents/:agentId/calls?page=&page_size=
 * e.g. /api/voice/agents/135636/calls?page=1&page_size=10
 */
export async function getVoiceAgentCalls(agentId, params = {}) {
  const { data } = await api.get(`/voice/agents/${encodeURIComponent(String(agentId))}/calls`, {
    params,
    headers: { Accept: 'application/json' },
  });
  return data;
}


export async function getVoiceAdminCalls(params = {}) {
  const { data } = await api.get('/voice/admin/calls', {
    params,
    headers: { Accept: 'application/json' },
  });
  return data;
}
