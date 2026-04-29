import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import {
  getOutboundAgentsAll,
  getOutboundCallAgents,
  normalizeOutboundAgentsList,
} from '../services/callsService';
import UiSelect from './UiSelect';

function resolveAgentId(aId) {
  const parsed = Number(aId);
  return Number.isNaN(parsed) ? aId : parsed;
}

export default function LeadForm({ lead, onSave, onCancel, saving }) {
  const { user } = useAuth();
  const isAdmin = getRole(user) === 'admin';

  const [form, setForm] = useState({
    hotel_name: '',
    owner_name: '',
    phone: '',
    email: '',
    rooms: '',
    location: '',
    notes: '',
  });
  const [outboundAgents, setOutboundAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [outboundAgentId, setOutboundAgentId] = useState('');
  const [agentError, setAgentError] = useState('');

  useEffect(() => {
    if (lead?.id) {
      setForm({
        hotel_name: lead.hotel_name ?? '',
        owner_name: lead.owner_name ?? '',
        phone: lead.phone ?? '',
        email: lead.email ?? '',
        rooms: lead.rooms ?? '',
        location: lead.location ?? '',
        notes: lead.notes ?? '',
      });
      const aid = lead.agent_id ?? lead.voice_agent_id ?? lead.outbound_agent_id;
      setOutboundAgentId(aid != null && String(aid).trim() !== '' ? String(aid) : '');
    } else {
      setForm({
        hotel_name: '',
        owner_name: '',
        phone: '',
        email: '',
        rooms: '',
        location: '',
        notes: '',
      });
      setOutboundAgentId('');
    }
  }, [lead]);

  useEffect(() => {
    let cancelled = false;
    async function loadAgents() {
      setAgentsLoading(true);
      try {
        const raw = isAdmin ? await getOutboundAgentsAll() : await getOutboundCallAgents();
        if (cancelled) return;
        const list = normalizeOutboundAgentsList(raw);
        setOutboundAgents(list);
        if (list.length > 0) {
          const first = list[0];
          const id = first?.id ?? first?.agent_id ?? first?._id;
          if (id != null && String(id) !== '') {
            setOutboundAgentId((prev) => (prev ? prev : String(id)));
          }
        }
      } catch {
        if (!cancelled) setOutboundAgents([]);
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    }
    loadAgents();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, lead?.id]);

  const outboundAgentOptions = useMemo(() => {
    if (agentsLoading) return [];
    if (!outboundAgents.length) return [{ value: '', label: 'No agents available' }];
    return outboundAgents.map((a) => {
      const id = a?.id ?? a?.agent_id ?? a?._id;
      const label = a?.name ?? a?.agent_name ?? a?.bot_name ?? a?.email ?? String(id ?? 'Agent');
      return { value: String(id ?? ''), label: String(label) };
    });
  }, [agentsLoading, outboundAgents]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setAgentError('');
    if (!lead?.id && !outboundAgentId) {
      setAgentError('Select which agent should handle calls for this lead.');
      return;
    }
    const payload = {
      ...form,
      rooms: form.rooms === '' ? undefined : Number(form.rooms) || 0,
      status: lead?.status ?? 'new',
      tags: Array.isArray(lead?.tags) ? lead.tags : [],
    };
    if (outboundAgentId) {
      payload.agent_id = resolveAgentId(outboundAgentId);
    }
    onSave(payload);
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-[13px] leading-snug text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none';

  const labelClass = 'mb-0.5 block text-[11px] font-medium text-slate-500 sm:text-xs';

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
        <div className="sm:col-span-2">
          <label htmlFor="lead-form-outbound-agent" className={labelClass}>
            Outbound agent {!lead?.id ? '*' : ''}
          </label>
          <UiSelect
            id="lead-form-outbound-agent"
            aria-label="Outbound voice agent"
            className="w-full"
            value={outboundAgentId}
            onChange={(v) => {
              setOutboundAgentId(v);
              setAgentError('');
            }}
            options={outboundAgentOptions}
            disabled={agentsLoading || saving}
            placeholder={agentsLoading ? 'Loading agents…' : 'Select agent'}
            dropdownZClass="z-[200]"
          />
          {agentError ? <p className="mt-1 text-[11px] text-red-600">{agentError}</p> : null}
        </div>
        <div>
          <label className={labelClass}>Hotel name *</label>
          <input name="hotel_name" value={form.hotel_name} onChange={handleChange} required className={inputClass} placeholder="Hotel name" />
        </div>
        <div>
          <label className={labelClass}>Owner name *</label>
          <input name="owner_name" value={form.owner_name} onChange={handleChange} required className={inputClass} placeholder="Owner name" />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+91…" />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="email@example.com" />
        </div>
        <div>
          <label className={labelClass}>Rooms</label>
          <input name="rooms" type="number" min="0" value={form.rooms} onChange={handleChange} className={inputClass} placeholder="0" />
        </div>
        <div>
          <label className={labelClass}>Location</label>
          <input name="location" value={form.location} onChange={handleChange} className={inputClass} placeholder="City, State" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className={`${inputClass} resize-y min-h-[2.75rem]`} placeholder="Optional notes…" />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-1.5 border-t border-slate-100 pt-2.5 sm:flex-row sm:justify-end sm:gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50 sm:px-3.5">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-primary-gradient rounded-lg px-3.5 py-2 text-[13px] font-semibold disabled:opacity-50 sm:px-4">
          {saving ? 'Saving…' : (lead?.id ? 'Update lead' : 'Create lead')}
        </button>
      </div>
    </form>
  );
}
