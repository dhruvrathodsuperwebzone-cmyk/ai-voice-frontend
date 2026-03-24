import { useState, useEffect } from 'react';
import ScriptSelector from './ScriptSelector';
import ScheduleSettings, { scheduleToApi } from './ScheduleSettings';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
];

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

function SettingsFields({ timezone, setTimezone, callFrequency, setCallFrequency, status, setStatus }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className={labelClass}>Campaign timezone</label>
        <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
          <option value="UTC">UTC</option>
          <option value="Asia/Kolkata">Asia/Kolkata</option>
          <option value="America/New_York">America/New_York</option>
          <option value="Europe/London">Europe/London</option>
        </select>
      </div>
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
      <div className="sm:col-span-2">
        <label className={labelClass}>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function CampaignForm({
  campaign,
  scripts = [],
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
  const [schedule, setSchedule] = useState(null);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [callFrequency, setCallFrequency] = useState('');
  const [status, setStatus] = useState('draft');

  const isCreate = layoutVariant === 'create';

  useEffect(() => {
    if (campaign) {
      setName(campaign.name ?? '');
      setScriptId(campaign.script_id ?? null);
      setSchedule(campaign.schedule ?? null);
      setTimezone(campaign.timezone ?? 'Asia/Kolkata');
      setCallFrequency(campaign.call_frequency !== undefined && campaign.call_frequency !== null ? String(campaign.call_frequency) : '');
      setStatus(campaign.status ?? 'draft');
    } else {
      setName('');
      setScriptId(null);
      setSchedule(null);
      setTimezone('Asia/Kolkata');
      setCallFrequency('');
      setStatus('draft');
    }
  }, [campaign]);

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      name: name.trim() || undefined,
      script_id: scriptId ?? undefined,
      schedule: scheduleToApi(schedule),
      timezone: timezone || undefined,
      call_frequency: callFrequency === '' || callFrequency == null ? undefined : Number(callFrequency),
      status,
      lead_list: (Array.isArray(leadList) ? leadList : []).map((l) => (typeof l === 'object' ? l.id : l)),
    };
    onSave(payload);
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

  const formGap = isCreate ? 'space-y-6 sm:space-y-7' : 'space-y-8';

  return (
    <form onSubmit={handleSubmit} className={formGap}>
      <FormSection
        variant={layoutVariant}
        step={isCreate ? 1 : undefined}
        title={isCreate ? 'Campaign name & script' : 'Basic info'}
        description={isCreate ? 'This is what your team sees in the list and what callers follow on the line.' : undefined}
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
        <ScriptSelector value={scriptId} onChange={setScriptId} scripts={scripts} />
      </FormSection>

      {showSchedule && (
        <>
          <FormSection
            variant={layoutVariant}
            step={isCreate ? 2 : undefined}
            title={isCreate ? 'Schedule & dialing rules' : 'Schedule'}
            description={isCreate ? 'Calling windows, days, timezone, cadence, and campaign status.' : undefined}
          >
            {isCreate ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-indigo-100/80 bg-white/80 p-4 sm:p-5">
                  <ScheduleSettings schedule={schedule} onChange={setSchedule} hideSectionTitle />
                </div>
                <SettingsFields
                  timezone={timezone}
                  setTimezone={setTimezone}
                  callFrequency={callFrequency}
                  setCallFrequency={setCallFrequency}
                  status={status}
                  setStatus={setStatus}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6">
                <ScheduleSettings schedule={schedule} onChange={setSchedule} />
              </div>
            )}
          </FormSection>
          {!isCreate && (
            <FormSection variant={layoutVariant} title="Settings">
              <SettingsFields
                timezone={timezone}
                setTimezone={setTimezone}
                callFrequency={callFrequency}
                setCallFrequency={setCallFrequency}
                status={status}
                setStatus={setStatus}
              />
            </FormSection>
          )}
        </>
      )}

      {!showSchedule && (
        <FormSection variant={layoutVariant} title="Settings">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SettingsFields
              timezone={timezone}
              setTimezone={setTimezone}
              callFrequency={callFrequency}
              setCallFrequency={setCallFrequency}
              status={status}
              setStatus={setStatus}
            />
          </div>
        </FormSection>
      )}

      {showLeadList && (
        <FormSection
          variant={layoutVariant}
          step={isCreate ? 3 : undefined}
          title="Assign leads"
          description={isCreate ? 'Optional—you can add more leads later from the campaign page.' : undefined}
        >
          {availableLeads.length > 0 ? (
            <>
              <label className={labelClass}>Add leads</label>
              <select
                className={inputClass}
                aria-label="Add a lead to this campaign"
                onChange={(e) => {
                  const idVal = e.target.value;
                  if (!idVal) return;
                  const lead = availableLeads.find((l) => String(l.id) === idVal);
                  if (lead) addLead(lead);
                  e.target.value = '';
                }}
              >
                <option value="">Choose a lead to add…</option>
                {availableLeads.filter((l) => !selectedIds.includes(l.id)).map((l) => (
                  <option key={l.id} value={l.id}>{l.hotel_name || l.owner_name || l.email || `Lead ${l.id}`}</option>
                ))}
              </select>
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
          disabled={saving}
          className="btn-primary-gradient w-full rounded-xl px-5 py-3 text-sm font-semibold shadow-md shadow-indigo-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 sm:w-auto sm:py-2.5"
        >
          {saving ? 'Saving…' : (campaign?.id ? 'Update campaign' : 'Create campaign')}
        </button>
      </div>
    </form>
  );
}
