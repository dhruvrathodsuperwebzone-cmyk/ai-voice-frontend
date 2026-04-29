import { useEffect, useMemo, useState } from 'react';
import { PaginationBar } from '../components/PaginationBar';
import UiSelect from '../components/UiSelect';
import PageLoader, { SpinnerDot } from '../components/PageLoader';
import { getOutboundAdminAgents, getOutboundCallAgents } from '../services/callsService';
import { useAuth } from '../store/authContext';
import { isAdmin } from '../utils/roleUtils';
import { agentIdForVoiceCallsApi, getVoiceAdminCalls, getVoiceAgentCalls, getVoiceCallById } from '../services/voiceService';

/** Matches GET /api/voice/agents/:id/calls?page=1&page_size=10 (same as your curl). */
const API_PAGE_SIZE = 10;

/** Never show these as table columns (product choice). */
const OMIT_LOG_COLUMNS = new Set(['bot_name', 'user_name', 'status']);

const DIRECTION_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' },
];

function normalizeAgentsResponse(res) {
  const body = res?.data ?? res;
  const list =
    body?.agents ??
    body?.items ??
    body?.data ??
    (Array.isArray(body) ? body : []);
  return Array.isArray(list) ? list : [];
}

/** `local_agent_id` query param for admin GET /voice/admin/calls (prefers explicit local id from API). */
function localAgentIdForAdminFilter(a) {
  if (!a || typeof a !== 'object') return '';
  const v = a.local_agent_id ?? a.localAgentId ?? a.id ?? a.agent_id ?? a._id;
  return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

/**
 * Supports:
 * - { success, data: { call_log_data: [...], total_records } }
 * - { success, data: [...], pagination }
 * - { calls: [...] }
 */
function parseVoiceAgentCallsResponse(res, pageSize) {
  const root = res && typeof res === 'object' ? res : {};
  const dataLayer = root.data;

  let list = [];
  if (Array.isArray(dataLayer)) {
    list = dataLayer;
  } else if (dataLayer && typeof dataLayer === 'object' && !Array.isArray(dataLayer)) {
    const nested =
      (Array.isArray(dataLayer.call_log_data) ? dataLayer.call_log_data : null) ??
      (Array.isArray(dataLayer.calls) ? dataLayer.calls : null) ??
      (Array.isArray(dataLayer.items) ? dataLayer.items : null) ??
      (Array.isArray(dataLayer.data) ? dataLayer.data : null);
    list = Array.isArray(nested) ? nested : [];
  }
  if (list.length === 0) {
    const fallback =
      (Array.isArray(root.calls) ? root.calls : null) ??
      (Array.isArray(root.items) ? root.items : null) ??
      (Array.isArray(root) ? root : []);
    list = Array.isArray(fallback) ? fallback : [];
  }

  const pagination = root.pagination ?? root.meta ?? {};
  const dataMeta = typeof dataLayer === 'object' && dataLayer && !Array.isArray(dataLayer) ? dataLayer : {};
  const total =
    Number(
      pagination.total ??
        pagination.total_records ??
        dataMeta.total_records ??
        root.total_records ??
        root.total
    ) || list.length;
  const limit = Number(pagination.page_size ?? pagination.limit ?? dataMeta.page_size ?? pageSize) || pageSize;
  const totalPages =
    Number(pagination.totalPages ?? pagination.total_pages ?? dataMeta.total_pages ?? dataMeta.totalPages) ||
    Math.max(1, Math.ceil(total / limit) || 1);
  return { rows: list, total, totalPages };
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function rowDirectionKey(value) {
  const v = String(value || '').toLowerCase();
  if (v === 'incoming' || v === 'inbound') return 'inbound';
  if (v === 'outgoing' || v === 'outbound') return 'outbound';
  return v;
}

function formatDirectionCell(value) {
  const k = rowDirectionKey(value);
  if (k === 'inbound') return 'Inbound';
  if (k === 'outbound') return 'Outbound';
  return formatCell(value);
}

function pad2(n) {
  return String(Math.max(0, Number(n) || 0)).padStart(2, '0');
}

function formatDurationHMS(value, row) {
  const secondsFromRow = Number(row?.call_duration_in_seconds);
  if (Number.isFinite(secondsFromRow) && secondsFromRow >= 0) {
    const h = Math.floor(secondsFromRow / 3600);
    const m = Math.floor((secondsFromRow % 3600) / 60);
    const s = Math.floor(secondsFromRow % 60);
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  const raw = String(value || '').trim();
  if (!raw) return '-';

  const providerMatch = raw.match(/^(\d+)\.\d+:(\d+)\.\d+$/);
  if (providerMatch) {
    const mins = Number(providerMatch[1]);
    const secs = Number(providerMatch[2]);
    const total = (Number.isFinite(mins) ? mins : 0) * 60 + (Number.isFinite(secs) ? secs : 0);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  const parts = raw.split(':').map((p) => Number(String(p).replace(/[^\d]/g, '')));
  if (parts.every((n) => Number.isFinite(n))) {
    let h = 0;
    let m = 0;
    let s = 0;
    if (parts.length === 3) [h, m, s] = parts;
    else if (parts.length === 2) [m, s] = parts;
    else if (parts.length === 1) s = parts[0];
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  }

  return raw;
}

function headerLabel(key) {
  return key.replaceAll('_', ' ');
}

function statusPill(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value === 'failed') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (value === 'dispatched') return 'border-violet-200 bg-violet-50 text-violet-800';
  if (value === 'no-answer' || value === 'busy') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function formatCreatedAt(value) {
  if (value == null || value === '') return '-';
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  } catch {
    return String(value);
  }
}

function directionPill(direction) {
  const value = String(direction || '').toLowerCase();
  if (value === 'inbound' || value === 'incoming') return 'border-blue-200 bg-blue-50 text-blue-700';
  if (value === 'outbound' || value === 'outgoing') return 'border-violet-200 bg-violet-50 text-violet-700';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function parseConversationFallback(conversation) {
  if (!conversation) return [];
  const text = String(conversation).replace(/\\n/g, '\n').replace(/^\[|\]$/g, '').replace(/^['"]|['"]$/g, '');
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const messages = [];
  lines.forEach((line, idx) => {
    if (line.startsWith('LLM:')) {
      messages.push({ id: `llm-${idx}`, role: 'bot', text: line.replace(/^LLM:\s*/, '') });
    } else if (line.startsWith('User:')) {
      messages.push({ id: `usr-${idx}`, role: 'user', text: line.replace(/^User:\s*/, '') });
    }
  });
  return messages;
}

function extractMessages(payload) {
  const rawCallData = payload?.data?.call_log_data ?? payload?.data ?? payload;
  const callData = Array.isArray(rawCallData) ? rawCallData[0] : rawCallData;

  const interactions = Array.isArray(callData?.interactions) ? callData.interactions : [];
  if (interactions.length > 0) {
    return interactions.flatMap((it, idx) => {
      const out = [];
      const userText = String(it?.user_query || '').trim();
      const botText = String(it?.bot_response || '').trim();
      if (userText) out.push({ id: `u-${idx}`, role: 'user', text: userText, at: it?.time_of_call || '' });
      if (botText) out.push({ id: `b-${idx}`, role: 'bot', text: botText, at: it?.time_of_call || '' });
      return out;
    });
  }

  return parseConversationFallback(callData?.call_conversation);
}

export default function AllLogPage() {
  const { user } = useAuth();
  const isAdminUser = isAdmin(user);

  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentsError, setAgentsError] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  /** Admin call log: `GET /voice/admin/calls?local_agent_id=…` (empty = all agents). */
  const [adminLocalAgentId, setAdminLocalAgentId] = useState('');

  const [rows, setRows] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState('all');
  const [callsLoading, setCallsLoading] = useState(false);

  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [detailRecord, setDetailRecord] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      setAgentsLoading(true);
      setAgentsError('');
      if (!isAdminUser) setAdminLocalAgentId('');
      try {
        const res = isAdminUser ? await getOutboundAdminAgents() : await getOutboundCallAgents();
        if (cancelled) return;
        const list = normalizeAgentsResponse(res);
        setAgents(list);
        setSelectedAgentId((prev) => {
          if (isAdminUser) return '';
          if (prev) return prev;
          return agentIdForVoiceCallsApi(list[0]);
        });
      } catch (err) {
        if (cancelled) return;
        setAgentsError(err?.response?.data?.message || err?.message || 'Failed to load agents');
        setAgents([]);
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    }

    loadAgents();
    return () => {
      cancelled = true;
    };
  }, [isAdminUser]);

  useEffect(() => {
    if (!isAdminUser && !selectedAgentId) {
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
      return;
    }

    let cancelled = false;

    async function load() {
      setCallsLoading(true);
      setError('');
      try {
        const adminParams = { page, page_size: API_PAGE_SIZE };
        if (adminLocalAgentId.trim()) {
          const raw = adminLocalAgentId.trim();
          const n = Number(raw);
          adminParams.local_agent_id = Number.isFinite(n) && String(n) === raw ? n : raw;
        }
        const res = isAdminUser
          ? await getVoiceAdminCalls(adminParams)
          : await getVoiceAgentCalls(selectedAgentId, { page, page_size: API_PAGE_SIZE });
        if (cancelled) return;
        const parsed = parseVoiceAgentCallsResponse(res, API_PAGE_SIZE);
        setRows(parsed.rows);
        setTotalRecords(parsed.total);
        setTotalPages(parsed.totalPages);
      } catch (err) {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load call logs');
        setRows([]);
        setTotalRecords(0);
        setTotalPages(1);
      } finally {
        if (!cancelled) setCallsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAdminUser, selectedAgentId, page, adminLocalAgentId]);

  const displayRows = useMemo(() => {
    if (direction === 'all') return rows;
    return rows.filter((r) => rowDirectionKey(r?.call_direction ?? r?.direction) === direction);
  }, [rows, direction]);

  const tableBusy =
    (!isAdminUser && agentsLoading) || ((isAdminUser || selectedAgentId) && callsLoading);

  const columns = useMemo(() => {
    const keys = new Set();
    const sample = displayRows.length ? displayRows : [];
    sample.forEach((row) => Object.keys(row || {}).forEach((k) => keys.add(k)));
    const important = [
      'contact_name',
      'phone',
      'voice_agent_name',
      'voice_agent_id',
      'created_at',
      'from_number',
      'to_number',
      'call_direction',
      'call_status',
      'time_of_call',
      'call_duration',
    ];
    const picked = important.filter((c) => keys.has(c) && !OMIT_LOG_COLUMNS.has(c));
    if (picked.length > 0) return picked;
    return [...keys].filter((k) => !OMIT_LOG_COLUMNS.has(k)).slice(0, 6);
  }, [displayRows]);

  const effectiveTotalPages = totalPages;

  const agentSelectOptions = useMemo(() => {
    if (agentsLoading) return [];
    if (isAdminUser && agents.length === 0) {
      return [{ value: '', label: 'All agents (none listed)' }];
    }
    const out = [];
    if (isAdminUser) out.push({ value: '', label: 'All agents' });
    if (agents.length) {
      for (const a of agents) {
        const apiId = agentIdForVoiceCallsApi(a);
        const label = a?.name ?? a?.agent_name ?? a?.bot_name ?? a?.email ?? String(apiId || 'Agent');
        const optionValue = isAdminUser ? localAgentIdForAdminFilter(a) || apiId : apiId;
        out.push({ value: String(optionValue ?? ''), label: String(label) });
      }
    } else {
      out.push({ value: '', label: 'No agents available' });
    }
    return out;
  }, [agentsLoading, isAdminUser, agents]);

  async function handleViewChat(row) {
    /** Voice call id for GET /api/voice/calls/:id (e.g. 2782034) */
    const id = row?.id ?? row?.call_id ?? row?.voice_call_id;
    if (id == null || String(id).trim() === '') return;
    setChatModalOpen(true);
    setChatMessages([]);
    setDetailRecord(null);
    setChatError('');
    setChatLoading(true);
    try {
      const data = await getVoiceCallById(id);
      setDetailRecord(data);
      const messages = extractMessages(data);
      setChatMessages(messages);
    } catch (err) {
      setChatError(err?.response?.data?.message || err?.message || 'Failed to load call detail.');
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-slate-200/80">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Call Log</h1>
      </div>

      {agentsError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{agentsError}</div>
      )}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-violet-200/40 bg-white shadow-lg shadow-indigo-950/[0.04] ring-1 ring-violet-100/50">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50/40 via-white to-indigo-50/30 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm font-semibold text-slate-800">Call logs</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <label htmlFor="all-log-agent-select" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Agent
              </label>
              <UiSelect
                id="all-log-agent-select"
                aria-label="Filter call logs by agent"
                className="w-full min-w-[12rem] max-w-[20rem] sm:w-auto"
                value={isAdminUser ? adminLocalAgentId : selectedAgentId}
                onChange={(v) => {
                  if (isAdminUser) setAdminLocalAgentId(v);
                  else setSelectedAgentId(v);
                  setPage(1);
                }}
                options={agentSelectOptions}
                disabled={agentsLoading}
                placeholder={agentsLoading ? 'Loading agents…' : 'Select agent'}
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <label
                htmlFor="all-log-direction-filter"
                className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:shrink-0"
              >
                Direction
              </label>
              <UiSelect
                id="all-log-direction-filter"
                aria-label="Filter by call direction"
                className="w-full min-w-0 sm:w-auto sm:min-w-[12rem]"
                value={direction}
                onChange={(v) => {
                  setDirection(v);
                  setPage(1);
                }}
                options={DIRECTION_FILTER_OPTIONS}
                placeholder="Direction"
              />
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
              {tableBusy ? (
                <>
                  <SpinnerDot className="border-violet-600" />
                  Loading
                </>
              ) : (
                `${displayRows.length} row${displayRows.length === 1 ? '' : 's'}`
              )}
            </span>
          </div>
        </div>

        {!isAdminUser && !selectedAgentId && !agentsLoading ? (
          <div className="flex items-center justify-center px-4 py-10 text-sm font-medium text-slate-500">
            Select an agent to load call logs.
          </div>
        ) : tableBusy ? (
          <PageLoader message="Loading logs…" className="min-h-[12rem] px-4 py-8" />
        ) : displayRows.length === 0 ? (
          <div className="flex items-center justify-center px-4 py-10 text-sm font-medium text-slate-500">
            {rows.length === 0 ? 'No data returned from API.' : 'No calls match this direction on this page.'}
          </div>
        ) : (
          <div className="table-scroll-x overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    Sr No
                  </th>
                  {columns.map((col) => (
                    <th key={col} className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-600">
                      {headerLabel(col)}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wide text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, i) => (
                  <tr key={row?.call_id ?? row?.id ?? `row-${i}`} className="border-t border-slate-100 transition-colors hover:bg-violet-50/25">
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      {(page - 1) * API_PAGE_SIZE + i + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={`${i}-${col}`} className="max-w-[20rem] whitespace-nowrap px-4 py-3 text-center text-slate-700">
                        {col === 'call_status' || col === 'status' ? (
                          <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusPill(row?.[col])}`}>
                            {formatCell(row?.[col])}
                          </span>
                        ) : col === 'call_direction' ? (
                          <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${directionPill(row?.[col])}`}>
                            {formatDirectionCell(row?.[col])}
                          </span>
                        ) : (
                          <span
                            className="inline-block max-w-[20rem] truncate align-middle font-medium"
                            title={
                              col === 'call_duration'
                                ? formatDurationHMS(row?.[col], row)
                                : col === 'created_at'
                                  ? formatCreatedAt(row?.[col])
                                  : formatCell(row?.[col])
                            }
                          >
                            {col === 'call_duration'
                              ? formatDurationHMS(row?.[col], row)
                              : col === 'created_at'
                                ? formatCreatedAt(row?.[col])
                                : formatCell(row?.[col])}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewChat(row)}
                        disabled={!(row?.id ?? row?.call_id ?? row?.voice_call_id)}
                        className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationBar
          page={page}
          totalPages={Math.max(1, effectiveTotalPages)}
          totalCount={totalRecords}
          pageSize={API_PAGE_SIZE}
          onPage={setPage}
          disabled={tableBusy || (!isAdminUser && !selectedAgentId)}
          variant="simple"
          size="compact"
          className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
        />
      </div>

      {chatModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40"
            onClick={() => {
              setChatModalOpen(false);
              setDetailRecord(null);
            }}
            aria-hidden="true"
          />
          <div className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[96vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-50/60 px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold text-slate-900">Call detail</p>
              <button
                type="button"
                onClick={() => {
                  setChatModalOpen(false);
                  setDetailRecord(null);
                }}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <div
              className="max-h-[calc(92vh-3.75rem)] min-h-[50vh] overflow-y-auto overflow-x-hidden p-4 sm:min-h-[55vh] sm:p-5"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)',
                backgroundSize: '18px 18px',
              }}
            >
              {chatLoading ? (
                <PageLoader message="Loading conversation…" className="min-h-[40vh] py-8" size="md" />
              ) : chatError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{chatError}</div>
              ) : chatMessages.length === 0 && detailRecord ? (
                <div className="flex min-h-[40vh] items-center justify-center px-4">
                  <p className="text-sm font-medium text-slate-600">No conversation.</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center text-sm font-medium text-slate-600">No conversation.</div>
              ) : (
                <div className="space-y-2">
                  {chatMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                          m.role === 'user'
                            ? 'rounded-br-md bg-emerald-200/90 text-slate-900'
                            : 'rounded-bl-md bg-white text-slate-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
