import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../store/authContext';
import UiSelect from './UiSelect';
import { getRole } from '../utils/roleUtils';
import {
  getOutboundAgentsAll,
  getOutboundCallAgents,
  normalizeOutboundAgentsList,
} from '../services/callsService';

export default function ImportLeadsModal({ onImport, onClose, importing }) {
  const { user } = useAuth();
  const isAdmin = getRole(user) === 'admin';

  const [file, setFile] = useState(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [error, setError] = useState('');
  const [outboundAgents, setOutboundAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [agentId, setAgentId] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function loadAgents() {
      setAgentsLoading(true);
      try {
        const raw = isAdmin ? await getOutboundAgentsAll() : await getOutboundCallAgents();
        if (cancelled) return;
        const list = normalizeOutboundAgentsList(raw);
        setOutboundAgents(list);
        const first = list[0];
        const id = first?.id ?? first?.agent_id ?? first?._id;
        if (id != null && String(id) !== '') setAgentId(String(id));
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
  }, [isAdmin]);

  const agentUiOptions = useMemo(() => {
    if (agentsLoading) return [];
    if (!outboundAgents.length) return [{ value: '', label: 'No agents available' }];
    return outboundAgents.map((a) => {
      const id = a?.id ?? a?.agent_id ?? a?._id;
      const label = a?.name ?? a?.agent_name ?? a?.bot_name ?? a?.email ?? String(id ?? 'Agent');
      return { value: String(id ?? ''), label: String(label) };
    });
  }, [agentsLoading, outboundAgents]);

  function handleFileChange(e) {
    const f = e.target.files?.[0];
    setError('');
    if (f) {
      const name = f.name.toLowerCase();
      const isValid = name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls');
      if (!isValid) {
        setError('Please select a CSV or Excel file (.csv, .xlsx, .xls).');
        setFile(null);
        return;
      }
      setFile(f);
    } else {
      setFile(null);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV or Excel file.');
      return;
    }
    if (!agentId) {
      setError('Select an outbound agent for this upload.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', 'Leads Bulk Campaign');
    formData.append('is_scheduled', String(!!isScheduled));
    formData.append('phone_number_id', '2410');
    formData.append('agent_id', String(agentId));
    onImport(formData);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Bulk upload (CSV/Excel)</h3>
        <p className="text-sm text-slate-600 mb-4">
          Upload a CSV or Excel file and trigger voice bulk upload.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3">
            <div>
              <label htmlFor="import-leads-agent" className="block text-sm font-medium text-slate-700 mb-1">
                Outbound agent *
              </label>
              <UiSelect
                id="import-leads-agent"
                aria-label="Outbound agent for bulk upload"
                className="w-full"
                value={agentId}
                onChange={(v) => {
                  setAgentId(v);
                  setError('');
                }}
                options={agentUiOptions}
                disabled={agentsLoading || importing}
                placeholder={agentsLoading ? 'Loading agents…' : 'Select agent'}
                dropdownZClass="z-[200]"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Is scheduled
            </label>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
            <button
              type="submit"
              disabled={!file || !agentId || importing || agentsLoading}
              className="btn-primary-gradient rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {importing ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
