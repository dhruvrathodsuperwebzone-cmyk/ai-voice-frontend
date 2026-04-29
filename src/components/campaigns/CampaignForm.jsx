import { useState, useEffect, useMemo } from 'react';
import ScriptSelector from './ScriptSelector';
import UiSelect from '../UiSelect';
import ScheduleSettings, { buildCreateCampaignSchedulePayload, scheduleToApi } from './ScheduleSettings';

const CAMPAIGN_TIMEZONE = 'Asia/Kolkata';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-shadow';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

function FormSection({ step, title, description, children, variant }) {
  if (variant === 'create') {
    return (
      <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/30 to-violet-50/20 p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start gap-3 sm:gap-4">
          {step != null && (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-violet-500/20">
              {step}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
          </div>
        </div>
        <div className="space-y-4">{children}</div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
      {children}
    </section>
  );
}

function SettingsFields({ callFrequency, setCallFrequency }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:max-w-md">
      <div>
        <label className={labelClass}>Call frequency (number)</label>
        <input
          type="number"
          min={0}
          value={callFrequency}
          onChange={(e) => setCallFrequency(e.target.value)}
          placeholder="e.g. 3"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-slate-500">Max calls per lead per period (e.g. 3).</p>
      </div>
      <p className="text-xs text-slate-500">All schedule times use India Standard Time (IST).</p>
    </div>
  );
}

const CONTACT_MODES = {
  manual: 'manual',
  csv: 'csv',
  leads: 'leads',
};

const CONTACT_MODE_OPTIONS = [
  { value: CONTACT_MODES.manual, label: 'Add manually' },
  { value: CONTACT_MODES.csv, label: 'CSV file' },
  { value: CONTACT_MODES.leads, label: 'Via leads' },
];

export default function CampaignForm({
  campaign,
  scripts = [],
  scriptsLoading = false,
  agents = [],
  agentsLoading = false,
  onSave,
  onCancel,
  saving,
  showSchedule = true,
  showLeadList = true,
  leadList = [],
  onLeadListChange,
  availableLeads = [],
  layoutVariant = 'default',
}) {
  const [name, setName] = useState('');
  const [scriptId, setScriptId] = useState(null);
  const [agentId, setAgentId] = useState('');
  const [contactMode, setContactMode] = useState(CONTACT_MODES.manual);
  const [manualContacts, setManualContacts] = useState([{ name: '', contact: '' }]);
  const [csvFile, setCsvFile] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [callFrequency, setCallFrequency] = useState('');
  const [status, setStatus] = useState('draft');

  const isCreate = layoutVariant === 'create';

  useEffect(() => {
    if (campaign) {
      setName(campaign.name ?? '');
      setScriptId(campaign.script_id ?? null);
      setSchedule(campaign.schedule ?? null);
      setCallFrequency(campaign.call_frequency !== undefined && campaign.call_frequency !== null ? String(campaign.call_frequency) : '');
      setStatus(campaign.status ?? 'draft');
    } else {
      setName('');
      setScriptId(null);
      setSchedule(null);
      setCallFrequency('');
      setStatus('draft');
    }
  }, [campaign]);

  useEffect(() => {
    if (!isCreate) return;
    if (!agents.length) return;
    setAgentId((prev) => {
      if (prev !== '') return prev;
      const first = agents[0];
      const id = first?.id ?? first?.agent_id ?? first?._id;
      return id != null ? String(id) : '';
    });
  }, [isCreate, agents]);

  useEffect(() => {
    if (!isCreate) return;
    if (!scripts.length) return;
    setScriptId((prev) => {
      if (prev != null && prev !== '') return prev;
      const sid = scripts[0]?.id ?? scripts[0]?.script_id;
      if (sid == null) return prev;
      return typeof sid === 'number' ? sid : Number(sid) || sid;
    });
  }, [isCreate, scripts]);

  function handleSubmit(e) {
    e.preventDefault();
    const leadIdsFromList = (Array.isArray(leadList) ? leadList : []).map((l) => (typeof l === 'object' ? l.id : l));

    const basePayload = {
      name: name.trim() || undefined,
      schedule: scheduleToApi(schedule),
      timezone: CAMPAIGN_TIMEZONE,
      call_frequency: callFrequency === '' || callFrequency == null ? undefined : Number(callFrequency),
      status,
    };

    if (isCreate) {
      const parsedAgent = Number(agentId);
      const parsedScript = Number(scriptId);
      const voice_agent_id =
        agentId === '' ? undefined : Number.isNaN(parsedAgent) ? agentId : parsedAgent;
      const sid =
        scriptId == null || scriptId === ''
          ? undefined
          : Number.isNaN(parsedScript)
            ? scriptId
            : parsedScript;
      const dateSchedule = buildCreateCampaignSchedulePayload(schedule);
      onSave({
        name: name.trim() || undefined,
        script_id: sid,
        voice_agent_id,
        ...dateSchedule,
        timezone: CAMPAIGN_TIMEZONE,
        call_frequency: callFrequency === '' || callFrequency == null ? undefined : Number(callFrequency),
        status,
        lead_list: contactMode === CONTACT_MODES.leads ? leadIdsFromList : [],
      });
      return;
    }

    onSave({
      ...basePayload,
      script_id: scriptId ?? undefined,
      lead_list: leadIdsFromList,
    });
  }

  function addManualRow() {
    setManualContacts((rows) => [...rows, { name: '', contact: '' }]);
  }

  function updateManualRow(index, field, value) {
    setManualContacts((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addLead(lead) {
    if (!onLeadListChange || !lead?.id) return;
    const list = Array.isArray(leadList) ? [...leadList] : [];
    if (list.some((l) => l.id === lead.id || l === lead.id)) return;
    list.push(typeof lead === 'object' ? lead.id : lead);
    onLeadListChange(list);
  }

  function removeLead(id) {
    if (!onLeadListChange) return;
    const list = (Array.isArray(leadList) ? leadList : []).filter((l) => (typeof l === 'object' ? l.id : l) !== id);
    onLeadListChange(list);
  }

  const selectedIds = Array.isArray(leadList) ? leadList.map((l) => (typeof l === 'object' ? l.id : l)) : [];

  const agentSelectOptions = useMemo(() => {
    if (agentsLoading) return [];
    if (!agents.length) return [{ value: '', label: 'No outbound agents available' }];
    return agents.map((a) => {
      const id = a?.id ?? a?.agent_id ?? a?._id;
      const label = a?.name ?? a?.agent_name ?? a?.email ?? String(id ?? 'Agent');
      return { value: String(id ?? ''), label: String(label) };
    });
  }, [agentsLoading, agents]);

  const addLeadSelectOptions = useMemo(
    () =>
      availableLeads
        .filter((l) => !selectedIds.includes(l.id))
        .map((l) => ({
          value: String(l.id),
          label: l.hotel_name || l.owner_name || l.email || `Lead ${l.id}`,
        })),
    [availableLeads, selectedIds],
  );

  function toggleLeadSelected(id) {
    if (!onLeadListChange) return;
    const list = Array.isArray(leadList) ? [...leadList] : [];
    const normalized = list.map((l) => (typeof l === 'object' ? l.id : l));
    const hit = normalized.findIndex((x) => String(x) === String(id));
    if (hit >= 0) normalized.splice(hit, 1);
    else normalized.push(id);
    onLeadListChange(normalized);
  }

  function isLeadSelected(leadId) {
    return selectedIds.some((sid) => String(sid) === String(leadId));
  }

  const formGap = isCreate ? 'space-y-6 sm:space-y-7' : 'space-y-8';

  return (
    <form onSubmit={handleSubmit} className={formGap}>
      <FormSection
        variant={layoutVariant}
        step={isCreate ? 1 : undefined}
        title={isCreate ? 'Campaign name, script & agent' : 'Basic info'}
        description={
          isCreate
            ? 'Name your campaign, pick the calling script, and choose which voice agent will run it.'
            : undefined
        }
      >
        <div>
          <label className={labelClass}>Campaign name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Q1 Hotel outreach"
            className={inputClass}
          />
        </div>
        {isCreate ? (
          <>
            <ScriptSelector
              value={scriptId}
              onChange={setScriptId}
              scripts={scripts}
              disabled={scriptsLoading || saving}
              required
            />
            <div>
              <label htmlFor="campaign-form-voice-agent" className={labelClass}>
                Voice agent *
              </label>
              <UiSelect
                id="campaign-form-voice-agent"
                aria-label="Voice agent for campaign"
                value={agentId}
                onChange={(v) => setAgentId(v)}
                options={agentSelectOptions}
                disabled={agentsLoading || saving}
                placeholder={agentsLoading ? 'Loading agents…' : 'Select agent'}
                dropdownZClass="z-[120]"
              />
            </div>
          </>
        ) : (
          <ScriptSelector value={scriptId} onChange={setScriptId} scripts={scripts} />
        )}
      </FormSection>

      {isCreate && (
        <FormSection
          variant={layoutVariant}
          step={2}
          title="Contact"
          description="Add numbers manually, upload a CSV, or select leads you already created."
        >
          <div>
            <label htmlFor="campaign-form-contact-mode" className={labelClass}>
              How to add contacts
            </label>
            <UiSelect
              id="campaign-form-contact-mode"
              aria-label="How to add contacts"
              value={contactMode}
              onChange={(v) => setContactMode(v)}
              options={CONTACT_MODE_OPTIONS}
              placeholder="Add manually"
              dropdownZClass="z-[120]"
            />
          </div>

          {contactMode === CONTACT_MODES.manual && (
            <div className="space-y-4">
              {manualContacts.map((row, idx) => (
                <div
                  key={`manual-${idx}`}
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
                >
                  <div>
                    <label className={labelClass}>Name</label>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => updateManualRow(idx, 'name', e.target.value)}
                      placeholder="Contact name"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Contact / number</label>
                    <input
                      type="text"
                      value={row.contact}
                      onChange={(e) => updateManualRow(idx, 'contact', e.target.value)}
                      placeholder="+919876543210"
                      className={inputClass}
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addManualRow}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50/90 px-3 py-2 text-xs font-semibold text-violet-900 shadow-sm transition-colors hover:bg-violet-100/90"
              >
                + Add another row
              </button>
            </div>
          )}

          {contactMode === CONTACT_MODES.csv && (
            <div>
              <label className={labelClass}>Upload CSV</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                className={`${inputClass} py-2 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-violet-900`}
              />
              {csvFile ? (
                <p className="mt-2 text-xs text-slate-600">
                  Selected: <span className="font-medium text-slate-800">{csvFile.name}</span>
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">Upload a .csv file with your contact list.</p>
              )}
            </div>
          )}

          {contactMode === CONTACT_MODES.leads && (
            <div className="space-y-2">
              {availableLeads.length > 0 ? (
                <>
                  <ul className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/40 p-2 sm:p-3">
                    {availableLeads.map((l) => (
                      <li key={l.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white">
                          <input
                            type="checkbox"
                            checked={isLeadSelected(l.id)}
                            onChange={() => toggleLeadSelected(l.id)}
                            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="min-w-0 text-sm text-slate-800">
                            <span className="font-medium">
                              {l.hotel_name || l.owner_name || l.email || `Lead ${l.id}`}
                            </span>
                            {l.phone ? (
                              <span className="mt-0.5 block text-xs text-slate-500">{l.phone}</span>
                            ) : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {selectedIds.length === 0 ? (
                    <p className="text-xs text-slate-500">Select one or more leads.</p>
                  ) : null}
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-center">
                  <p className="text-sm text-slate-600">No leads in your workspace yet.</p>
                  <p className="mt-1 text-xs text-slate-500">Add leads from the Leads page, then return here.</p>
                </div>
              )}
            </div>
          )}
        </FormSection>
      )}

      {showSchedule && (
        <>
          <FormSection
            variant={layoutVariant}
            step={isCreate ? 3 : undefined}
            title={isCreate ? 'Schedule & dialing rules' : 'Schedule'}
            description={
              isCreate
                ? 'Calling windows, days of week, and cadence. Times use India (IST).'
                : undefined
            }
          >
            {isCreate ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-indigo-100/80 bg-white/80 p-4 sm:p-5">
                  <ScheduleSettings schedule={schedule} onChange={setSchedule} hideSectionTitle />
                </div>
                <SettingsFields callFrequency={callFrequency} setCallFrequency={setCallFrequency} />
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                <ScheduleSettings schedule={schedule} onChange={setSchedule} />
              </div>
            )}
          </FormSection>
          {!isCreate && (
            <FormSection variant={layoutVariant} title="Settings">
              <SettingsFields callFrequency={callFrequency} setCallFrequency={setCallFrequency} />
            </FormSection>
          )}
        </>
      )}

      {!showSchedule && (
        <FormSection variant={layoutVariant} title="Settings">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsFields callFrequency={callFrequency} setCallFrequency={setCallFrequency} />
          </div>
        </FormSection>
      )}

      {showLeadList && !isCreate && (
        <FormSection
          variant={layoutVariant}
          title="Assign leads"
          description={isCreate ? 'Optional—you can add more leads later from the campaign page.' : undefined}
        >
          {availableLeads.length > 0 ? (
            <>
              <label htmlFor="campaign-form-add-lead" className={labelClass}>
                Add leads
              </label>
              <UiSelect
                id="campaign-form-add-lead"
                aria-label="Add a lead to this campaign"
                value=""
                onChange={(idVal) => {
                  if (!idVal) return;
                  const lead = availableLeads.find((l) => String(l.id) === idVal);
                  if (lead) addLead(lead);
                }}
                options={addLeadSelectOptions}
                placeholder="Choose a lead to add…"
                disabled={addLeadSelectOptions.length === 0}
                dropdownZClass="z-[120]"
              />
              {(Array.isArray(leadList) ? leadList : []).length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {(Array.isArray(leadList) ? leadList : []).map((item) => {
                    const id = typeof item === 'object' ? item.id : item;
                    const lead = availableLeads.find((l) => l.id === id) || { id, hotel_name: `Lead ${id}` };
                    return (
                      <li
                        key={id}
                        className="inline-flex max-w-full items-center gap-2 rounded-xl border border-violet-100/80 bg-gradient-to-r from-violet-50/80 to-indigo-50/40 py-1.5 pl-3 pr-1.5 text-sm text-slate-800 shadow-sm"
                      >
                        <span className="truncate">{lead.hotel_name || lead.owner_name || `Lead ${id}`}</span>
                        <button
                          type="button"
                          onClick={() => removeLead(id)}
                          className="shrink-0 rounded-lg p-1 text-slate-500 transition-colors hover:bg-white/80 hover:text-red-600"
                          aria-label={`Remove ${lead.hotel_name || 'lead'}`}
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500">No leads selected yet.</p>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-center">
              <p className="text-sm text-slate-600">No leads in your workspace yet.</p>
              <p className="mt-1 text-xs text-slate-500">Add leads from the Leads page, then return here.</p>
            </div>
          )}
        </FormSection>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:w-auto sm:py-2.5"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || (isCreate && (agentsLoading || scriptsLoading))}
          className="btn-primary-gradient w-full rounded-xl px-5 py-3 text-sm font-semibold shadow-md shadow-indigo-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 sm:w-auto sm:py-2.5"
        >
          {saving ? 'Saving…' : (campaign?.id ? 'Update campaign' : 'Create campaign')}
        </button>
      </div>
    </form>
  );
}
