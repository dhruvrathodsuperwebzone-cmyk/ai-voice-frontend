import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../store/toastContext';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import { PaginationBar } from '../components/PaginationBar';
import PageLoader, { SpinnerDot } from '../components/PageLoader';
import {
  createOmniAgent,
  deleteAdminOmniAgent,
  deleteOmniAgent,
  getAdminOmnidimAgents,
  getAdminOmniAgent,
  getOmniAgents,
  patchAdminOmniAgent,
  updateOmniAgent,
} from '../services/omniAgentsService';

const DEFAULT_PAGE_SIZE = 10;
/** Admin omnidim bot grid: fixed page size (no per-page selector in UI). */
const DEFAULT_ADMIN_BOT_PAGE_SIZE = 6;

const omnidimBotCardClass =
  'group flex min-h-0 flex-col overflow-hidden rounded-2xl border border-violet-200/45 bg-gradient-to-br from-white via-white to-violet-50/40 shadow-md shadow-indigo-950/[0.06] ring-1 ring-violet-100/40 transition-[box-shadow,transform] hover:shadow-lg hover:shadow-indigo-950/[0.08]';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-shadow disabled:opacity-70';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

const defaultSection = () => ({
  title: '',
  body: '',
  is_enabled: true,
});

function normalizeOmniAgents(res) {
  if (res == null) return { list: [], total: 0 };
  const body = res?.data ?? res;
  const list =
    body?.bots ??
    body?.agents ??
    body?.items ??
    body?.results ??
    body?.omni_agents ??
    body?.omnidim_agents ??
    body?.omnidimAgents ??
    body?.data?.bots ??
    body?.data?.agents ??
    body?.data?.items ??
    (Array.isArray(body?.data) ? body.data : null) ??
    (Array.isArray(body) ? body : []);

  const total =
    body?.total_records ??
    body?.total ??
    body?.count ??
    body?.total_count ??
    res?.pagination?.total ??
    body?.pagination?.total ??
    body?.page_info?.total ??
    list?.length ??
    0;

  return { list: Array.isArray(list) ? list : [], total: Number(total) || 0 };
}

function getAgentId(a) {
  return a?.id ?? a?.agent_id ?? a?._id ?? a?.omni_agent_id ?? a?.omnidim_agent_id;
}

/** Admin GET/PATCH `/omni/admin/agents/:id` expects Omnidim external id or omni bot id (e.g. 149450), not workspace id 13 when those differ. */
function getAdminOmniAgentApiId(a) {
  if (!a || typeof a !== 'object') return null;
  const ext = a.external_id ?? a.externalId;
  if (ext != null && String(ext).trim() !== '') return ext;
  const omniId = a?.omni?.id;
  if (omniId != null && String(omniId).trim() !== '') return omniId;
  return getAgentId(a);
}

function getAgentName(a) {
  return a?.name ?? a?.agent_name ?? a?.omnidim_agent_name ?? a?.title ?? '';
}
function getAgentWelcome(a) {
  return (
    a?.welcome_message ??
    a?.welcomeMessage ??
    a?.integrations?.welcome_message ??
    a?.omni?.welcome_message ??
    ''
  );
}
function getAgentDescription(a) {
  return (
    a?.description ??
    a?.agent_description ??
    a?.agentDescription ??
    a?.integrations?.description ??
    ''
  );
}

function normalizeContextSection(s) {
  if (!s || typeof s !== 'object') return { title: '', body: '', is_enabled: true };
  return {
    ...s,
    title: String(s.title ?? s.context_title ?? ''),
    body: String(s.body ?? s.context_body ?? ''),
    is_enabled: s.is_enabled == null ? true : !!s.is_enabled,
  };
}

function getContextBreakdown(a) {
  const cb =
    a?.context_breakdown ??
    a?.contextBreakdown ??
    a?.integrations?.context_breakdown ??
    a?.omni?.context_breakdown ??
    [];
  const arr = Array.isArray(cb) ? cb : [];
  return arr.map(normalizeContextSection);
}

/** API: `{ success, data: [ agent ], pagination }` or a single agent object. */
function unwrapAdminAgentDetail(res) {
  if (res == null) return null;
  let c = Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : res;
  if (Array.isArray(c)) c = c.length > 0 ? c[0] : null;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return null;
  if (c.agent && typeof c.agent === 'object' && !Array.isArray(c.agent)) {
    return { ...c.agent, ...c };
  }
  return c;
}

function humanizeVoiceProvider(p) {
  if (p == null || p === false) return '';
  const s = String(p).toLowerCase();
  if (s.includes('google')) return 'Google';
  if (s.includes('eleven')) return 'ElevenLabs';
  return String(p);
}

/** One line a normal user can read (no raw voice IDs in the card). */
function formatVoiceForUser(b) {
  const nameOk = b?.voice_name && b.voice_name !== false;
  if (nameOk) {
    const prov = humanizeVoiceProvider(b?.voice_provider);
    return prov ? `${String(b.voice_name)} · ${prov}` : String(b.voice_name);
  }
  const prov = humanizeVoiceProvider(b?.voice_provider);
  const accent = b?.english_voice_accent && b.english_voice_accent !== false ? String(b.english_voice_accent) : '';
  if (prov && accent) return `${prov} voice · ${accent}`;
  if (prov) return `${prov} voice`;
  if (accent) return `Voice accent ${accent}`;
  return '—';
}

function formatCreatorName(b) {
  if (b?.user_name && b.user_name !== false) return String(b.user_name).trim();
  return '';
}

function formatCallDirection(b) {
  if (b?.bot_call_type == null || b.bot_call_type === false) return '';
  const s = String(b.bot_call_type);
  if (s.toLowerCase().includes('out')) return 'Outgoing calls';
  if (s.toLowerCase().includes('in')) return 'Incoming calls';
  return s;
}

function formatFlowLabel(flowRaw) {
  if (flowRaw == null || flowRaw === false) return '—';
  const s = String(flowRaw).toLowerCase();
  if (s.includes('complete')) return 'Ready';
  if (s.includes('fail') || s.includes('error')) return 'Needs attention';
  if (s.includes('progress') || s.includes('pending') || s.includes('build')) return 'Setting up';
  return String(flowRaw);
}

function formatBotLanguages(b) {
  const langs = b?.language;
  if (!Array.isArray(langs) || langs.length === 0) return '—';
  return langs.join(', ');
}

function botFlowStatusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('complete')) return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (s.includes('fail') || s.includes('error')) return 'border-red-200 bg-red-50 text-red-800';
  if (s.includes('progress') || s.includes('pending') || s.includes('build')) return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function DeleteConfirmModal({
  open,
  agentName,
  agentId,
  deleting,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  const title = agentName?.trim() || 'this agent';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/45 p-4 pb-8 backdrop-blur-[2px] sm:items-center sm:pb-4"
      role="presentation"
      onClick={deleting ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-100/90"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-agent-title"
        aria-describedby="delete-agent-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-red-100/80 bg-gradient-to-br from-red-50/90 via-white to-orange-50/20 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 ring-1 ring-red-200/60">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 id="delete-agent-title" className="text-lg font-bold tracking-tight text-slate-900">
                Delete agent?
              </h2>
              <p id="delete-agent-desc" className="mt-1 text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">{title}</span>
                {agentId != null && <span className="text-slate-500"> (ID {agentId})</span>}{' '}
                will be removed permanently. This cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-red-900/20 transition-opacity hover:from-red-500 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
          >
            {deleting ? 'Deleting…' : 'Delete agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OmnidimBotDeleteModal({ bot, deleting, onClose, onConfirm }) {
  if (!bot) return null;
  const name = String(bot?.name || '').trim() || 'this bot';
  const apiId = getAdminOmniAgentApiId(bot);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/45 p-4 pb-8 backdrop-blur-[2px] sm:items-center sm:pb-4"
      role="presentation"
      onClick={deleting ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-100/90"
        role="dialog"
        aria-modal="true"
        aria-labelledby="omnidim-del-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-red-100/80 bg-gradient-to-br from-red-50/90 via-white to-orange-50/20 px-5 py-4 sm:px-6 sm:py-5">
          <h2 id="omnidim-del-title" className="text-lg font-bold tracking-tight text-slate-900">
            Delete agent?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-800">{name}</span>
            {apiId != null && String(apiId).trim() !== '' && (
              <span className="text-slate-500"> (ID {apiId})</span>
            )}{' '}
            will be removed if the server allows it.
          </p>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-red-900/20 transition-opacity hover:from-red-500 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentWizard({
  mode,
  initialAgent,
  onCancel,
  onSubmit,
  submitting,
  /** `'admin'` = full omni admin edit (name, welcome, description, flow); `'default'` = agent/viewer (context only). */
  editVariant = 'default',
}) {
  const isEdit = mode === 'edit';
  const isAdminOmniEdit = isEdit && editVariant === 'admin';
  const [step, setStep] = useState(1);
  const [name, setName] = useState(getAgentName(initialAgent));
  const [welcomeMessage, setWelcomeMessage] = useState(getAgentWelcome(initialAgent));
  const [description, setDescription] = useState(getAgentDescription(initialAgent));
  const [contextBreakdown, setContextBreakdown] = useState(() => {
    const cb = getContextBreakdown(initialAgent);
    return cb.length ? cb : [defaultSection()];
  });

  useEffect(() => {
    if (!initialAgent) return;
    setName(getAgentName(initialAgent));
    setWelcomeMessage(getAgentWelcome(initialAgent));
    setDescription(getAgentDescription(initialAgent));
    const cb = getContextBreakdown(initialAgent);
    setContextBreakdown(cb.length ? cb : [defaultSection()]);
    setStep(1);
  }, [initialAgent]);

  const canProceedStep1 = useMemo(() => {
    const n = String(name || '').trim();
    const w = String(welcomeMessage || '').trim();
    if (isAdminOmniEdit) return n.length > 0 && w.length > 0;
    if (isEdit) return true;
    const d = String(description || '').trim();
    return n.length > 0 && w.length > 0 && d.length > 0;
  }, [isAdminOmniEdit, isEdit, name, welcomeMessage, description]);

  function addSection() {
    setContextBreakdown((prev) => [...(Array.isArray(prev) ? prev : []), defaultSection()]);
  }

  function removeSection(idx) {
    setContextBreakdown((prev) => {
      const next = (Array.isArray(prev) ? prev : []).filter((_, i) => i !== idx);
      return next.length ? next : [defaultSection()];
    });
  }

  function updateSection(idx, patch) {
    setContextBreakdown((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  async function submit(e) {
    e.preventDefault();

    if (isEdit) {
      const context_breakdown = (Array.isArray(contextBreakdown) ? contextBreakdown : [])
        .map((s) => ({
          title: String(s?.title || '').trim(),
          body: String(s?.body || '').trim(),
          is_enabled: s?.is_enabled == null ? true : !!s.is_enabled,
        }))
        .filter((s) => s.title.length > 0 || s.body.length > 0);

      const normalized = context_breakdown.length ? context_breakdown : [defaultSection()];
      if (isAdminOmniEdit) {
        await onSubmit({
          name: String(name || '').trim(),
          welcome_message: String(welcomeMessage || '').trim(),
          description: String(description || '').trim(),
          context_breakdown: normalized,
        });
      } else {
        await onSubmit({ context_breakdown: normalized });
      }
      return;
    }

    await onSubmit({
      name: String(name || '').trim() || undefined,
      welcome_message: String(welcomeMessage || '').trim() || undefined,
      description: String(description || '').trim() || undefined,
    });
  }

  return (
    <div className="space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/30 p-6 shadow-md shadow-indigo-950/[0.04] ring-1 ring-violet-100/50">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-36 w-56 rounded-full bg-indigo-400/15 blur-3xl" aria-hidden />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600/90">Agents</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {isEdit ? 'Edit agent' : 'Create support agent'}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {isEdit
                ? 'Update the context sections for this agent.'
                : 'Create with name, welcome message, and description.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-100/80 transition-colors hover:bg-slate-50/60"
          >
            Back to list
          </button>
        </div>

        {isEdit ? (
          <div className="mt-5 flex items-center gap-3">
            <span className={`h-2 w-2 rounded-full ${step === 1 ? 'bg-indigo-600' : 'bg-slate-300'}`} aria-hidden />
            <span className={`h-2 w-2 rounded-full ${step === 2 ? 'bg-indigo-600' : 'bg-slate-300'}`} aria-hidden />
            <span className="text-xs font-semibold text-slate-500">
              Step {step} of 2
            </span>
          </div>
        ) : null}
      </header>

      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/[0.04] ring-1 ring-slate-100/90">
        <form onSubmit={submit} className="p-5 sm:p-7 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Name {isEdit && !isAdminOmniEdit ? null : '*'}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Support Agent"
                    className={inputClass}
                    disabled={isEdit && !isAdminOmniEdit}
                  />
                </div>
                <div>
                  <label className={labelClass}>Welcome message {isEdit && !isAdminOmniEdit ? null : '*'}</label>
                  <input
                    type="text"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Hello!"
                    className={inputClass}
                    disabled={isEdit && !isAdminOmniEdit}
                  />
                </div>
                {!isEdit && (
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Description *</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Support for vehicle questions and booking"
                      className={inputClass}
                      disabled={isEdit}
                    />
                  </div>
                )}
                {isEdit && (
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Description</label>
                    {isAdminOmniEdit ? (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className={inputClass}
                      />
                    ) : (
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={inputClass}
                        disabled={true}
                      />
                    )}
                  </div>
                )}
              </section>

              {isEdit ? (
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-slate-500">
                    {isAdminOmniEdit
                      ? 'Welcome message and all flow steps come from the server; edit as needed, then save.'
                      : 'In edit mode, only context sections are updated.'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    className="btn-primary-gradient w-full sm:w-auto rounded-xl px-5 py-3 text-sm font-semibold shadow-md shadow-indigo-900/10 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              ) : (
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary-gradient w-full sm:w-auto rounded-xl px-5 py-3 text-sm font-semibold shadow-md shadow-indigo-900/10 disabled:opacity-50"
                  >
                    {submitting ? 'Creating…' : 'Create agent'}
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && isEdit && (
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900">Context sections</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Add multiple sections. Each section becomes an item inside `context_breakdown`.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSection}
                    className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm hover:bg-violet-50/50"
                  >
                    + Add section
                  </button>
                </div>

                {(Array.isArray(contextBreakdown) ? contextBreakdown : []).map((s, idx) => (
                  <div
                    key={s?.id != null ? `section-${s.id}` : `section-${idx}`}
                    className="rounded-2xl border border-slate-200/90 bg-slate-50/40 p-4 shadow-sm ring-1 ring-slate-100/70"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-800/90">
                          Section {idx + 1}
                        </p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {String(s?.title ?? s?.context_title ?? '')
                            .trim() || 'Untitled'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                          <input
                            type="checkbox"
                            checked={s?.is_enabled == null ? true : !!s.is_enabled}
                            onChange={(e) => updateSection(idx, { is_enabled: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Enabled
                        </label>
                        <button
                          type="button"
                          onClick={() => removeSection(idx)}
                          disabled={(contextBreakdown || []).length <= 1}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50/70 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Title *</label>
                        <input
                          type="text"
                          value={s.title ?? s.context_title ?? ''}
                          onChange={(e) => updateSection(idx, { title: e.target.value })}
                          placeholder="Purpose"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Body *</label>
                        <textarea
                          value={s.body ?? s.context_body ?? ''}
                          onChange={(e) => updateSection(idx, { body: e.target.value })}
                          placeholder="Handles support."
                          rows={3}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50/70"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary-gradient w-full sm:w-auto rounded-xl px-5 py-3 text-sm font-semibold shadow-md shadow-indigo-900/10 disabled:opacity-50"
                >
                  {submitting ? (isEdit ? 'Updating…' : 'Creating…') : isEdit ? 'Update agent' : 'Create agent'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const role = getRole(user);
  const isAdmin = role === 'admin';
  const isViewer = role === 'viewer';
  /** Same list + card layout as admin: GET /omni/admin/omnidim-agents (viewer read-only). */
  const useAdminAgentListApi = isAdmin || isViewer;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState([]);
  const [total, setTotal] = useState(0);

  const [page, setPage] = useState(1);
  const resolvedPageSize = useAdminAgentListApi ? DEFAULT_ADMIN_BOT_PAGE_SIZE : DEFAULT_PAGE_SIZE;

  const [view, setView] = useState('list'); // list | create | edit
  const [editingAgent, setEditingAgent] = useState(null);
  /** Admin-only: GET /omni/admin/agents/:id in flight (value is API id, e.g. external_id). */
  const [editLoadingId, setEditLoadingId] = useState(null);

  const [deleteAgent, setDeleteAgent] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [deleteOmnidimBot, setDeleteOmnidimBot] = useState(null);
  const [deletingOmnidim, setDeletingOmnidim] = useState(false);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, page_size: resolvedPageSize };
      const res = useAdminAgentListApi ? await getAdminOmnidimAgents(params) : await getOmniAgents(params);
      const normalized = normalizeOmniAgents(res);
      setAgents(normalized.list);
      setTotal(normalized.total);
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        err?.message ??
        'Failed to load agents';
      setError(msg);
      toast.error(msg, { title: 'Agents load failed' });
      setAgents([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, resolvedPageSize, toast, useAdminAgentListApi]);

  useEffect(() => {
    if (view !== 'list') return;
    fetchAgents();
  }, [fetchAgents, view]);

  const totalCount = total > 0 ? total : agents.length;
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / resolvedPageSize));

  const openCreate = () => {
    setEditingAgent(null);
    setView('create');
  };

  const openEdit = useCallback(
    async (agent) => {
      if (!isAdmin) {
        setEditingAgent(agent);
        setView('edit');
        return;
      }
      const apiId = getAdminOmniAgentApiId(agent);
      if (apiId == null || String(apiId).trim() === '') {
        toast.error('This bot has no API id (external id / omni id). It cannot be edited here.', {
          title: 'Cannot edit',
        });
        return;
      }
      setEditLoadingId(apiId);
      try {
        const res = await getAdminOmniAgent(apiId);
        const detail = unwrapAdminAgentDetail(res);
        const merged = detail ? { ...agent, ...detail } : agent;
        setEditingAgent(merged);
        setView('edit');
      } catch (err) {
        const msg =
          err?.response?.data?.message ??
          err?.response?.data?.detail ??
          err?.message ??
          'Failed to load agent';
        toast.error(msg, { title: 'Load failed' });
      } finally {
        setEditLoadingId(null);
      }
    },
    [isAdmin, toast]
  );

  const closeWizard = () => {
    setView('list');
    setEditingAgent(null);
  };

  async function handleCreate(payload) {
    await createOmniAgent(payload);
    toast.success('Agent created successfully.', { title: 'Success' });
    closeWizard();
    fetchAgents();
  }

  async function handleUpdate(payload) {
    if (!editingAgent) return;
    if (isAdmin) {
      const apiId = getAdminOmniAgentApiId(editingAgent);
      if (apiId == null || String(apiId).trim() === '') return;
      await patchAdminOmniAgent(apiId, payload);
    } else {
      const id = getAgentId(editingAgent);
      if (!id) return;
      await updateOmniAgent(id, payload);
    }
    toast.success('Agent updated successfully.', { title: 'Success' });
    closeWizard();
    fetchAgents();
  }

  async function handleDelete() {
    if (!deleteAgent) return;
    const id = getAgentId(deleteAgent);
    if (!id) return;
    setDeleting(true);
    setError('');
    try {
      await deleteOmniAgent(id);
      toast.success('Agent deleted.', { title: 'Success' });
      setDeleteAgent(null);
      fetchAgents();
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        err?.message ??
        'Failed to delete agent';
      setError(msg);
      toast.error(msg, { title: 'Delete failed' });
    } finally {
      setDeleting(false);
    }
  }

  async function handleOmnidimDelete() {
    if (!deleteOmnidimBot) return;
    const apiId = getAdminOmniAgentApiId(deleteOmnidimBot);
    if (apiId == null || String(apiId).trim() === '') {
      toast.error('This agent has no API id and cannot be deleted here.', { title: 'Cannot delete' });
      return;
    }
    setDeletingOmnidim(true);
    try {
      await deleteAdminOmniAgent(apiId);
      toast.success('Agent deleted.', { title: 'Success' });
      setDeleteOmnidimBot(null);
      fetchAgents();
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        err?.message ??
        'Failed to delete agent';
      toast.error(msg, { title: 'Delete failed' });
    } finally {
      setDeletingOmnidim(false);
    }
  }

  const [submitting, setSubmitting] = useState(false);
  const submitWrapper = async (payload) => {
    setSubmitting(true);
    try {
      if (view === 'create') {
        await handleCreate(payload);
      } else {
        await handleUpdate(payload);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.detail ??
        err?.message ??
        'Failed to save agent';
      setError(msg);
      toast.error(msg, { title: 'Save failed' });
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'create') {
    return (
      <AgentWizard
        mode="create"
        initialAgent={{}}
        onCancel={closeWizard}
        onSubmit={submitWrapper}
        submitting={submitting}
      />
    );
  }

  if (view === 'edit') {
    return (
      <AgentWizard
        mode="edit"
        editVariant={isAdmin ? 'admin' : 'default'}
        initialAgent={editingAgent || {}}
        onCancel={closeWizard}
        onSubmit={submitWrapper}
        submitting={submitting}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/30 p-6 shadow-md shadow-indigo-950/[0.04] ring-1 ring-violet-100/50">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-36 w-56 rounded-full bg-indigo-400/15 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600/90">
              Agents
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Agent history</h1>
            {useAdminAgentListApi ? (
              <p className="mt-1 text-xs font-medium text-indigo-700/90">
                <span className="text-slate-600">All voice agents your organization has created.</span>
              </p>
            ) : null}
            <p className="mt-2 text-sm text-slate-600">
              {useAdminAgentListApi ? (
                <>
                  <span className="font-semibold text-slate-900">{totalCount}</span> agent{totalCount === 1 ? '' : 's'} total.
                </>
              ) : (
                <>
                  There are <span className="font-semibold text-slate-900">{totalCount}</span> agent{totalCount === 1 ? '' : 's'}.
                </>
              )}
            </p>
          </div>
          {!isViewer && (
            <div className="flex max-w-full flex-col items-stretch gap-2 sm:max-w-md sm:items-end">
              <button
                type="button"
                onClick={openCreate}
                className="btn-primary-gradient w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md shadow-indigo-900/10 sm:w-auto"
              >
                + Create agent
              </button>
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="flex gap-3 rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900 shadow-sm ring-1 ring-red-100/60" role="alert">
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-900/[0.03] ring-1 ring-slate-100/80">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Agents</h2>
            {isViewer ? (
              <p className="mt-1 text-sm text-slate-600">Same directory as admin. Read-only — no edit or delete.</p>
            ) : !useAdminAgentListApi ? (
              <p className="mt-1 text-sm text-slate-600">Edit context sections or delete an agent.</p>
            ) : null}
          </div>
        </div>

        {loading ? (
          <PageLoader message="Loading agents…" className="py-16" size="md" />
        ) : agents.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-semibold text-slate-900">{useAdminAgentListApi ? 'No agents on this page' : 'No agents yet'}</p>
            <p className="mt-2 text-sm text-slate-500">
              {useAdminAgentListApi ? 'No agents on this page — try another page.' : 'Create the first agent to start support automation.'}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6">
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Agents">
              {agents.map((b) => {
                if (useAdminAgentListApi) {
                  const id = b?.id;
                  const flowRaw =
                    b?.status_of_building_flow != null && b.status_of_building_flow !== false ? String(b.status_of_building_flow) : '';
                  const flowLabel = formatFlowLabel(flowRaw || null);
                  const creator = formatCreatorName(b);
                  const voiceLine = formatVoiceForUser(b);
                  const modelRaw = b?.llm_service != null && b.llm_service !== false ? String(b.llm_service) : '';
                  const model = modelRaw ? modelRaw.replace(/^gpt-/i, 'GPT-') : '';
                  const langs = formatBotLanguages(b);
                  const callLabel = formatCallDirection(b);
                  const canDelete = b?.allow_to_delete !== false;
                  const hasVoice = voiceLine && voiceLine !== '—';
                  const hasModel = Boolean(model);
                  const hasLangs = langs !== '—';

                  return (
                    <li key={String(id ?? b?.name)} className={omnidimBotCardClass}>
                      <div className="h-1 w-full shrink-0 bg-gradient-to-r from-violet-500/75 via-indigo-500/65 to-violet-400/55" aria-hidden />

                      <div className="flex flex-1 flex-col p-5 pt-4">
                        <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-900" title={b?.name || ''}>
                          {b?.name || 'Untitled bot'}
                        </h3>
                        {creator ? (
                          <p className="mt-2 text-sm text-slate-600">
                            <span className="text-slate-500">Created by</span> {creator}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">Creator not listed</p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {callLabel ? (
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                callLabel.includes('Outgoing')
                                  ? 'border-violet-200 bg-violet-50 text-violet-800'
                                  : 'border-sky-200 bg-sky-50 text-sky-800'
                              }`}
                            >
                              {callLabel}
                            </span>
                          ) : null}
                          {flowRaw ? (
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${botFlowStatusClass(flowRaw)}`}>
                              {flowLabel}
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 space-y-3 rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm ring-1 ring-slate-100/80">
                          {hasVoice ? (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Speaking voice</p>
                              <p className="mt-1 text-sm font-medium leading-snug text-slate-800">{voiceLine}</p>
                            </div>
                          ) : null}
                          {hasModel ? (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI model</p>
                              <p className="mt-1 text-sm font-medium text-slate-800">{model}</p>
                            </div>
                          ) : null}
                          {hasLangs ? (
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Languages</p>
                              <p className="mt-1 text-sm leading-snug text-slate-700">{langs}</p>
                            </div>
                          ) : null}
                          {!hasVoice && !hasModel && !hasLangs ? (
                            <p className="text-sm text-slate-500">Voice, model, and language details are not listed for this bot.</p>
                          ) : null}
                        </div>

                        {!isViewer && (
                          <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                            <button
                              type="button"
                              onClick={() => openEdit(b)}
                              disabled={editLoadingId != null}
                              className="min-h-[2.5rem] flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200/90 bg-indigo-50/90 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0 sm:flex-none sm:px-4"
                            >
                              {String(editLoadingId) === String(getAdminOmniAgentApiId(b) ?? '') ? (
                                <span className="inline-flex items-center justify-center gap-1.5">
                                  <SpinnerDot className="border-indigo-600" />
                                  Loading…
                                </span>
                              ) : (
                                'Edit'
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={!canDelete}
                              title={!canDelete ? 'This agent cannot be deleted here.' : undefined}
                              onClick={() => canDelete && setDeleteOmnidimBot(b)}
                              className="min-h-[2.5rem] flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 ring-1 ring-red-200/90 bg-red-50/90 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:flex-none sm:px-4"
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        {id != null ? (
                          <p className="mt-4 text-center font-mono text-[10px] text-slate-400">Reference #{id}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                }

                const id = getAgentId(b);
                const name = getAgentName(b) || 'Untitled agent';
                const welcome = getAgentWelcome(b);
                const cb = getContextBreakdown(b);
                const enabledCount = cb.filter((s) => s?.is_enabled).length;
                const isActive = cb.length > 0 && enabledCount === cb.length;
                const voiceLine = formatVoiceForUser(b);
                const modelRaw = b?.llm_service != null && b.llm_service !== false ? String(b.llm_service) : '';
                const model = modelRaw ? modelRaw.replace(/^gpt-/i, 'GPT-') : '';
                const langs = formatBotLanguages(b);
                const hasVoice = voiceLine && voiceLine !== '—';
                const hasModel = Boolean(model);
                const hasLangs = langs !== '—';

                return (
                  <li key={String(id ?? name)} className={omnidimBotCardClass}>
                    <div className="h-1 w-full shrink-0 bg-gradient-to-r from-violet-500/75 via-indigo-500/65 to-violet-400/55" aria-hidden />

                    <div className="flex flex-1 flex-col p-5 pt-4">
                      <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-900" title={name}>
                        {name}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600" title={welcome || ''}>
                        {welcome?.trim() ? welcome : <span className="text-slate-500">No welcome message set.</span>}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {cb.length === 0 ? (
                          <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            No sections
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Partial
                          </span>
                        )}
                        {cb.length > 0 ? (
                          <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                            {cb.length} section{cb.length === 1 ? '' : 's'}
                            {enabledCount < cb.length ? ` · ${enabledCount} enabled` : ''}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 space-y-3 rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm ring-1 ring-slate-100/80">
                        {hasVoice ? (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Speaking voice</p>
                            <p className="mt-1 text-sm font-medium leading-snug text-slate-800">{voiceLine}</p>
                          </div>
                        ) : null}
                        {hasModel ? (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">AI model</p>
                            <p className="mt-1 text-sm font-medium text-slate-800">{model}</p>
                          </div>
                        ) : null}
                        {hasLangs ? (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Languages</p>
                            <p className="mt-1 text-sm leading-snug text-slate-700">{langs}</p>
                          </div>
                        ) : null}
                        {!hasVoice && !hasModel && !hasLangs ? (
                          <p className="text-sm text-slate-500">Voice, model, and language details are not listed for this agent.</p>
                        ) : null}
                      </div>

                      {!isViewer && (
                        <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                          <button
                            type="button"
                            onClick={() => openEdit(b)}
                            className="min-h-[2.5rem] flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200/90 bg-indigo-50/90 hover:bg-indigo-100 sm:min-h-0 sm:flex-none sm:px-4"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteAgent(b)}
                            className="min-h-[2.5rem] flex-1 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 ring-1 ring-red-200/90 bg-red-50/90 hover:bg-red-100 sm:min-h-0 sm:flex-none sm:px-4"
                          >
                            Delete
                          </button>
                        </div>
                      )}

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

        {!loading && agents.length > 0 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={resolvedPageSize}
            onPage={setPage}
            disabled={loading}
          />
        )}
      </div>

      <DeleteConfirmModal
        open={deleteAgent != null}
        agentName={deleteAgent ? getAgentName(deleteAgent) : ''}
        agentId={deleteAgent ? getAgentId(deleteAgent) : null}
        deleting={deleting}
        onClose={() => !deleting && setDeleteAgent(null)}
        onConfirm={handleDelete}
      />

      <OmnidimBotDeleteModal
        bot={deleteOmnidimBot}
        deleting={deletingOmnidim}
        onClose={() => !deletingOmnidim && setDeleteOmnidimBot(null)}
        onConfirm={handleOmnidimDelete}
      />
    </div>
  );
}

