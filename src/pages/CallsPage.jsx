import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import { useToast } from '../store/toastContext';
import {
  getOutboundCallAgents,
  getOutboundAgentsAll,
  makeOutboundCall,
  makeOutboundCsvCall,
} from '../services/callsService';
import { downloadOutboundCallsSampleCsv } from '../utils/spreadsheetDownload';
import UiSelect from '../components/UiSelect';

function pickOutboundSuccessMessage(body) {
  if (!body || typeof body !== 'object') return 'Outbound call triggered.';
  const candidates = [
    body.message,
    body.msg,
    body.data?.message,
    body.data?.msg,
    body.result?.message,
  ];
  for (const c of candidates) {
    if (c != null && String(c).trim() !== '') return String(c).trim();
  }
  return 'Outbound call triggered.';
}

export default function CallsPage() {
  const { user } = useAuth();
  const role = getRole(user);
  const toast = useToast();
  const isViewer = role === 'viewer';
  const isAdmin = role === 'admin';

  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  const [callMode, setCallMode] = useState('single');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [agentId, setAgentId] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  const [calling, setCalling] = useState(false);
  const [callError, setCallError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAgents() {
      setAgentsLoading(true);
      setCallError('');
      try {
        const res = isAdmin ? await getOutboundAgentsAll() : await getOutboundCallAgents();
        const body = res?.data ?? res;
        const list =
          body?.agents ??
          body?.items ??
          body?.data ??
          (Array.isArray(body) ? body : []);
        const normalized = Array.isArray(list) ? list : [];
        if (cancelled) return;
        setAgents(normalized);

        const first = normalized[0];
        const id = first?.id ?? first?.agent_id ?? first?._id ?? '';
        if (id != null && String(id) !== '' && (!agentId || agentId === '')) {
          setAgentId(String(id));
        }
      } catch (err) {
        if (cancelled) return;
        const msg = err?.response?.data?.message || err?.message || 'Failed to load outbound agents.';
        setCallError(msg);
        toast.error(msg, { title: 'Agents load failed' });
        setAgents([]);
      } finally {
        if (!cancelled) setAgentsLoading(false);
      }
    }

    loadAgents();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, toast]);

  const agentOptions = useMemo(() => {
    if (agentsLoading) return [];
    if (!agents.length) return [{ value: '', label: 'No agents available' }];
    return agents.map((a) => {
      const id = a?.id ?? a?.agent_id ?? a?._id;
      const label = a?.name ?? a?.agent_name ?? a?.email ?? String(id ?? 'Agent');
      return { value: String(id ?? ''), label: String(label) };
    });
  }, [agentsLoading, agents]);

  function resolveAgentId(aId) {
    const parsedAgentId = Number(aId);
    return Number.isNaN(parsedAgentId) ? aId : parsedAgentId;
  }

  async function handleMakeCall(e) {
    e.preventDefault();
    if (isViewer) return;

    const aId = agentId;
    if (!aId) {
      const msg = 'Please select an agent.';
      setCallError(msg);
      toast.error(msg, { title: 'Missing agent' });
      return;
    }

    if (callMode === 'csv') {
      if (!csvFile) {
        const msg = 'Please choose a CSV file.';
        setCallError(msg);
        toast.error(msg, { title: 'Missing file' });
        return;
      }

      setCalling(true);
      setCallError('');
      try {
        const res = await makeOutboundCsvCall({
          agent_id: resolveAgentId(aId),
          file: csvFile,
        });
        const normalized = res?.data ?? res ?? {};
        const successMsg = pickOutboundSuccessMessage(normalized);
        toast.success(successMsg, { title: 'Success' });
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'CSV upload failed.';
        setCallError(msg);
        toast.error(msg, { title: 'CSV upload failed' });
      } finally {
        setCalling(false);
      }
      return;
    }

    const n = name.trim();
    const p = phone.trim();
    if (!n || !p) {
      const msg = 'Please enter name and phone.';
      setCallError(msg);
      toast.error(msg, { title: 'Missing fields' });
      return;
    }

    setCalling(true);
    setCallError('');
    try {
      const e = email.trim();
      const loc = location.trim();
      const payload = {
        name: n,
        phone: p,
        agent_id: resolveAgentId(aId),
        ...(e ? { email: e } : {}),
        ...(loc ? { location: loc } : {}),
      };
      const res = await makeOutboundCall(payload);
      const normalized = res?.data ?? res ?? {};
      const successMsg = pickOutboundSuccessMessage(normalized);
      toast.success(successMsg, { title: 'Success' });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Outbound call failed.';
      setCallError(msg);
      toast.error(msg, { title: 'Call failed' });
    } finally {
      setCalling(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/40 to-indigo-50/30 p-6 shadow-md shadow-indigo-950/[0.04] ring-1 ring-violet-100/50 sm:p-8">
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600/90">Calls</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Outbound Call</h1>
            
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
          {callError && (
            <div className="mb-4 rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900 shadow-sm ring-1 ring-red-100/60">
              {callError}
            </div>
          )}

          <form onSubmit={handleMakeCall} className="space-y-5">
            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">How to call</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'single', label: 'One contact' },
                  { id: 'csv', label: 'CSV file' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setCallMode(id);
                      setCallError('');
                    }}
                    disabled={isViewer || agentsLoading || calling}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                      callMode === id
                        ? 'btn-primary-gradient text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {callMode === 'single' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    disabled={isViewer || agentsLoading || calling}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    disabled={isViewer || agentsLoading || calling}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Email <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    disabled={isViewer || agentsLoading || calling}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Location <span className="font-normal text-slate-500">(optional)</span>
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, state or area"
                    disabled={isViewer || agentsLoading || calling}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <label className="block text-sm font-medium text-slate-700 sm:mb-1.5">Upload CSV</label>
                  <button
                    type="button"
                    onClick={() => {
                      downloadOutboundCallsSampleCsv();
                      toast.success('Sample downloaded. Columns: name, phone (required); email, location optional.', {
                        title: 'CSV template',
                        duration: 4000,
                      });
                    }}
                    className="shrink-0 self-start rounded-xl border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-900 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 sm:text-sm"
                    title="CSV columns: name, phone, email, location — one row per contact."
                  >
                    Download Excel / CSV sample
                  </button>
                </div>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={isViewer || agentsLoading || calling}
                  onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-violet-900 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-70"
                />
                
                {csvFile ? (
                  <p className="text-xs text-slate-600">
                    Selected: <span className="font-medium text-slate-800">{csvFile.name}</span>
                  </p>
                ) : null}
              </div>
            )}

            <div>
              <label htmlFor="calls-outbound-agent" className="block text-sm font-medium text-slate-700 mb-1.5">
                Agent
              </label>
              <UiSelect
                id="calls-outbound-agent"
                aria-label="Outbound voice agent"
                className="w-full"
                value={agentId}
                onChange={(v) => setAgentId(v)}
                options={agentOptions}
                disabled={isViewer || agentsLoading || calling}
                placeholder={agentsLoading ? 'Loading agents…' : 'Select agent'}
                dropdownZClass="z-[60]"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              
              <button
                type="submit"
                disabled={isViewer || agentsLoading || calling}
                className="btn-primary-gradient rounded-xl px-5 py-3 text-sm font-semibold shadow-md shadow-indigo-900/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 sm:py-2.5"
              >
                {calling ? (callMode === 'csv' ? 'Placing calls…' : 'Calling…') : callMode === 'csv' ? 'Start calls from CSV' : 'Make outbound call'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
