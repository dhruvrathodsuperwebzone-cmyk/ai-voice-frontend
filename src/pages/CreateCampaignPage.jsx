import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createCampaign } from '../services/campaignsService';
import { getLeads } from '../services/leadsService';
import { getScripts } from '../services/scriptsService';
import CampaignForm from '../components/campaigns/CampaignForm';
import { useToast } from '../store/toastContext';

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scripts, setScripts] = useState([]);
  const [availableLeads, setAvailableLeads] = useState([]);
  const [leadList, setLeadList] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getScripts({ limit: 200 })
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        const list = Array.isArray(data?.scripts) ? data.scripts : (Array.isArray(data) ? data : []);
        setScripts(list);
      })
      .catch(() => { if (!cancelled) setScripts([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    getLeads({ limit: 500 }).then((res) => {
      const data = res?.data ?? res;
      const list = Array.isArray(data?.leads) ? data.leads : (Array.isArray(data) ? data : []);
      setAvailableLeads(list);
    }).catch(() => setAvailableLeads([]));
  }, []);

  async function handleSave(payload) {
    setSaving(true);
    setError('');
    try {
      await createCampaign(payload);
      toast.success('Campaign created successfully.', { title: 'Success' });
      navigate('/dashboard/campaigns');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create campaign';
      setError(msg);
      toast.error(msg, { title: 'Create campaign failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/dashboard/campaigns"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-100/80 transition-colors hover:border-violet-200 hover:bg-violet-50/40 hover:text-violet-900"
        >
          <svg className="h-4 w-4 shrink-0 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to campaigns
        </Link>

      </div>

      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/45 to-indigo-50/35 p-6 shadow-md shadow-indigo-950/[0.05] ring-1 ring-violet-100/50 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-36 w-56 rounded-full bg-indigo-400/15 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute right-[18%] top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-purple-300/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600/90">New campaign</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              <span className="bg-black bg-clip-text text-transparent">
                Create a campaign
              </span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              Launch outbound AI calls with a clear script, respectful hours, and the right leads—all in a few minutes.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-white/70 px-3 py-1.5 text-xs font-medium text-violet-900 shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              Draft by default
            </span>
            <span className="inline-flex items-center rounded-full border border-indigo-200/60 bg-white/70 px-3 py-1.5 text-xs font-medium text-indigo-900 shadow-sm backdrop-blur-sm">
              Saves to campaign list
            </span>
          </div>
        </div>
      </header>

      <div className="min-w-0">
          {error && (
            <div
              className="mb-6 flex gap-3 rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900 shadow-sm ring-1 ring-red-100/60"
              role="alert"
            >
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/[0.04] ring-1 ring-slate-100/90">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-500 via-indigo-500 to-purple-600"
              aria-hidden
            />
            <div className="relative p-5 sm:p-7 lg:p-8">
              <CampaignForm
                campaign={null}
                scripts={scripts}
                onSave={handleSave}
                onCancel={() => navigate('/dashboard/campaigns')}
                saving={saving}
                showSchedule
                showLeadList
                leadList={leadList}
                onLeadListChange={setLeadList}
                availableLeads={availableLeads}
                layoutVariant="create"
              />
            </div>
          </div>
      </div>
    </div>
  );
}
