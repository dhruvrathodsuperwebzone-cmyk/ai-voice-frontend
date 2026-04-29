import { useEffect, useMemo, useState } from 'react';
import { getScriptNames } from '../../services/scriptsService';
import UiSelect from '../UiSelect';

const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

export default function ScriptSelector({ value, onChange, scripts = [], disabled, required = false }) {
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

  const uiOptions = useMemo(() => {
    const head = {
      value: '',
      label: loading ? 'Loading scripts…' : 'Select script',
      disabled: loading,
    };
    const rest = options.map((s) => ({ value: String(s.id), label: s.name }));
    return [head, ...rest];
  }, [loading, options]);

  return (
    <div>
      <label htmlFor="script-selector-field" className={labelClass}>
        Script{required ? ' *' : ''}
      </label>
      <UiSelect
        id="script-selector-field"
        aria-label="Campaign script"
        value={String(currentValue === null || currentValue === undefined ? '' : currentValue)}
        onChange={(v) => onChange(v === '' ? null : Number(v))}
        options={uiOptions}
        disabled={disabled || loading}
        placeholder="Select script"
        dropdownZClass="z-[120]"
      />
      {remoteError ? <p className="mt-1.5 text-xs text-rose-600">{remoteError}</p> : null}
    </div>
  );
}
