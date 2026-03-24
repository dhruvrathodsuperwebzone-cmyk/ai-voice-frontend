import { useState, useEffect } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COMMON_TIMEZONES = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Dubai'];

const DAY_NAMES = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_MAP = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };

const defaultSchedule = () => ({
  start_date: '',
  end_date: '',
  timezone: 'Asia/Kolkata',
  days: [1, 2, 3, 4, 5],
  start_time: '09:00',
  end_time: '18:00',
});

function parseSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return defaultSchedule();
  const s = { ...defaultSchedule(), ...schedule };
  if (Array.isArray(s.days)) {
    s.days = s.days
      .map((d) => (typeof d === 'string' ? DAY_MAP[d.toLowerCase()] : Number(d)))
      .filter((n) => n >= 1 && n <= 7);
    if (!s.days.length) s.days = [1, 2, 3, 4, 5];
  } else {
    s.days = [1, 2, 3, 4, 5];
  }
  if (s.start != null) s.start_time = s.start;
  if (s.end != null) s.end_time = s.end;
  return s;
}

export function scheduleToApi(form) {
  if (!form || typeof form !== 'object') return undefined;
  return {
    days: (form.days || []).map((d) => DAY_NAMES[Number(d) - 1]).filter(Boolean),
    start: form.start_time || '09:00',
    end: form.end_time || '18:00',
  };
}

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none";
const labelClass = "block text-sm font-medium text-slate-700 mb-1";

export default function ScheduleSettings({ schedule, onChange, disabled, hideSectionTitle = false }) {
  const [form, setForm] = useState(() => parseSchedule(schedule));

  // Sync from parent when schedule prop changes (e.g. campaign loaded)
  useEffect(() => {
    setForm(parseSchedule(schedule));
  }, [schedule]);

  // Push initial schedule to parent once on mount (empty deps on purpose to avoid loop; do not add form/schedule)
  useEffect(() => {
    onChange(parseSchedule(schedule));
  }, []);

  function toggleDay(d) {
    setForm((f) => {
      const days = f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort((a, b) => a - b);
      const next = { ...f, days };
      onChange(next);
      return next;
    });
  }

  function update(key, value) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      onChange(next);
      return next;
    });
  }

  return (
    <div className="space-y-5">
      {!hideSectionTitle && (
        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Schedule</h4>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Start date</label>
          <input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} disabled={disabled} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>End date</label>
          <input type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} disabled={disabled} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Timezone</label>
        <select value={form.timezone} onChange={(e) => update('timezone', e.target.value)} disabled={disabled} className={inputClass}>
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className={labelClass}>Call window start</label>
          <input type="time" value={form.start_time} onChange={(e) => update('start_time', e.target.value)} disabled={disabled} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className={labelClass}>Call window end</label>
          <input type="time" value={form.end_time} onChange={(e) => update('end_time', e.target.value)} disabled={disabled} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={`${labelClass} mb-2`}>Days to run</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((label, i) => {
            const d = i + 1;
            const on = form.days.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => !disabled && toggleDay(d)}
                className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${on ? 'btn-primary-gradient text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
