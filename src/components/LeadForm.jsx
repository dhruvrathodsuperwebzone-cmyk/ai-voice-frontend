import { useState, useEffect } from 'react';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'lost', 'not_interested'];

export default function LeadForm({ lead, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    hotel_name: '',
    owner_name: '',
    phone: '',
    email: '',
    rooms: '',
    location: '',
    status: 'new',
    tags: '',
    notes: '',
  });

  useEffect(() => {
    if (lead?.id) {
      setForm({
        hotel_name: lead.hotel_name ?? '',
        owner_name: lead.owner_name ?? '',
        phone: lead.phone ?? '',
        email: lead.email ?? '',
        rooms: lead.rooms ?? '',
        location: lead.location ?? '',
        status: lead.status ?? 'new',
        tags: Array.isArray(lead.tags) ? lead.tags.join(', ') : (lead.tags ?? ''),
        notes: lead.notes ?? '',
      });
    } else {
      setForm({
        hotel_name: '',
        owner_name: '',
        phone: '',
        email: '',
        rooms: '',
        location: '',
        status: 'new',
        tags: '',
        notes: '',
      });
    }
  }, [lead]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      rooms: form.rooms === '' ? undefined : Number(form.rooms) || 0,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };
    onSave(payload);
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-[13px] leading-snug text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 outline-none';

  const labelClass = 'mb-0.5 block text-[11px] font-medium text-slate-500 sm:text-xs';

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
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
          <label className={labelClass}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Tags (comma-separated)</label>
          <input name="tags" value={form.tags} onChange={handleChange} className={inputClass} placeholder="vip, follow-up" />
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
