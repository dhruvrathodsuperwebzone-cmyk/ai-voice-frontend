import { useEffect, useMemo, useState } from 'react';
import { getScriptNames } from '../../services/scriptsService';

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

export default function ScriptSelector({ value, onChange, scripts = [], disabled }) {
  const [remoteScripts, setRemoteScripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [remoteError, setRemoteError] = useState('');

  const hasScripts = Array.isArray(scripts) && scripts.length > 0;

  useEffect(() => {
    if (hasScripts) return;
    if (disabled) return;

    setLoading(true);
    setRemoteError('');
    getScriptNames()
      .then((data) => {
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.scripts)
            ? data.scripts
            : [];
        setRemoteScripts(normalized);
      })
      .catch((err) => {
        setRemoteError(err?.response?.data?.message || err?.message || 'Failed to load scripts');
        setRemoteScripts([]);
      })
      .finally(() => setLoading(false));
  }, [hasScripts, disabled]);

  const options = useMemo(() => {
    const list = hasScripts ? scripts : remoteScripts;
    if (!Array.isArray(list)) return [];
    return list
      .map((s) => {
        const id = s?.id ?? s?.script_id ?? s?.scriptId;
        const name = s?.name ?? s?.title ?? `Script ${id}`;
        if (id == null || name == null) return null;
        return { id, name };
      })
      .filter(Boolean);
  }, [hasScripts, scripts, remoteScripts]);

  const currentValue = value ?? '';

  return (
    <div>
      <label className={labelClass}>Script</label>
      <select
        value={currentValue}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        disabled={disabled || loading}
        className={inputClass}
      >
        <option value="">{loading ? 'Loading scripts…' : 'Select script'}</option>
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {remoteError ? <p className="mt-1.5 text-xs text-rose-600">{remoteError}</p> : null}
    </div>
  );
}
