import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';
import { getCampaignById, updateCampaign, deleteCampaign } from '../services/campaignsService';
import { getLeads } from '../services/leadsService';
import { getScripts } from '../services/scriptsService';
import CampaignForm from '../components/campaigns/CampaignForm';
import DeleteCampaignConfirmModal from '../components/campaigns/DeleteCampaignConfirmModal';
import PageLoader from '../components/PageLoader';

function formatSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return '—';
  const start = schedule.start ?? schedule.start_time;
  const end = schedule.end ?? schedule.end_time;
  const days = schedule.days;
  const parts = [];
  if (Array.isArray(days) && days.length) parts.push(`${days.length} days/week`);
  if (start && end) parts.push(`${start}–${end}`);
  return parts.length ? parts.join(' · ') : '—';
}

const statusStyles = {
  draft: 'bg-slate-100 text-slate-700 ring-slate-200/60',
  scheduled: 'bg-indigo-50 text-indigo-700 ring-indigo-200/60',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  paused: 'bg-amber-50 text-amber-700 ring-amber-200/60',
  completed: 'bg-slate-100 text-slate-600 ring-slate-200/60',
};

function SummaryTile({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100/80 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 text-indigo-600 ring-1 ring-violet-200/50">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = getRole(user) === 'viewer';
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [scripts, setScripts] = useState([]);
  const [availableLeads, setAvailableLeads] = useState([]);
  const [leadList, setLeadList] = useState([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteDeleting, setDeleteDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    getCampaignById(id)
      .then((res) => {
        const c = res?.data ?? res;
        setCampaign(c);
        setLeadList(Array.isArray(c?.lead_list) ? c.lead_list : []);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || err?.message || 'Failed to load campaign');
        setCampaign(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

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

  const scriptLabel = useMemo(() => {
    if (!campaign) return '—';
    const sid = campaign.script_id;
    if (sid == null) return '—';
    const s = scripts.find((x) => x.id === sid || String(x.id) === String(sid));
    return s?.name ? `${s.name} (#${sid})` : `Script #${sid}`;
  }, [campaign, scripts]);

  const savedLeadCount = campaign && Array.isArray(campaign.lead_list) ? campaign.lead_list.length : 0;
  const assignedCount = Array.isArray(leadList) ? leadList.length : savedLeadCount;

  async function handleSave(payload) {
    setSaving(true);
    setError('');
    try {
      await updateCampaign(id, payload);
      setCampaign((c) => (c ? { ...c, ...payload } : null));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleteDeleting(true);
    setError('');
    try {
      await deleteCampaign(id);
      setDeleteModalOpen(false);
      navigate('/dashboard/campaigns');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Delete failed');
    } finally {
      setDeleteDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl rounded-2xl border border-slate-200/90 bg-white py-24 shadow-md shadow-slate-900/[0.03] ring-1 ring-slate-100/80">
        <PageLoader message="Loading campaign…" className="min-h-[12rem]" size="lg" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-7xl space-y-4 rounded-2xl border border-red-200/80 bg-red-50/90 p-6 shadow-sm ring-1 ring-red-100/60 sm:p-8">
        <p className="font-medium text-red-800">{error || 'Campaign not found.'}</p>
        <Link
          to="/dashboard/campaigns"
          className="inline-flex items-center gap-2 rounded-xl border border-red-200/80 bg-white px-3.5 py-2 text-sm font-medium text-red-900 shadow-sm hover:bg-red-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to campaigns
        </Link>
      </div>
    );
  }

  const statusCls = statusStyles[campaign.status] || statusStyles.draft;
  const statusLabel = campaign.status ? String(campaign.status).replace(/_/g, ' ') : '—';

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <Link
        to="/dashboard/campaigns"
        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-100/80 transition-colors hover:border-violet-200 hover:bg-violet-50/40 hover:text-violet-900"
      >
        <svg className="h-4 w-4 shrink-0 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to campaigns
      </Link>

      <header className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-gradient-to-br from-white via-violet-50/45 to-indigo-50/35 p-6 shadow-md shadow-indigo-950/[0.05] ring-1 ring-violet-100/50 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-400/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-10 left-1/4 h-36 w-56 rounded-full bg-indigo-400/15 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600/90">Campaign</p>
            <h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              <span className="bg-gradient-to-r from-violet-800 via-indigo-700 to-purple-800 bg-clip-text text-transparent">
                {campaign.name || 'Untitled campaign'}
              </span>
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusCls}`}>
                {statusLabel}
              </span>
              <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm">
                ID {campaign.id}
              </span>
              {campaign.call_frequency != null && campaign.call_frequency !== '' && (
                <span className="rounded-full border border-violet-200/60 bg-white/70 px-3 py-1 text-xs font-medium text-violet-900 shadow-sm">
                  Frequency: {campaign.call_frequency}
                </span>
              )}
            </div>
          </div>
          {!isViewer && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="shrink-0 rounded-xl border border-red-200/90 bg-white/90 px-4 py-3 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-red-100/50 transition-colors hover:bg-red-50 sm:py-2.5"
            >
              Delete campaign
            </button>
          )}
        </div>
      </header>

      {error && (
        <div
          className="flex gap-3 rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm text-red-900 shadow-sm ring-1 ring-red-100/60"
          role="alert"
        >
          <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <section aria-labelledby="campaign-overview-heading">
        <h2 id="campaign-overview-heading" className="sr-only">
          Campaign overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryTile
            label="Schedule"
            value={formatSchedule(campaign.schedule)}
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          />
          <SummaryTile
            label="Timezone"
            value={campaign.timezone || '—'}
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          />
          <SummaryTile
            label="Script"
            value={scriptLabel}
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
          />
          <SummaryTile
            label="Leads assigned"
            value={assignedCount === 1 ? '1 lead' : `${assignedCount} leads`}
            icon={(
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
          />
        </div>
      </section>

      {!isViewer ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-lg shadow-slate-900/[0.04] ring-1 ring-slate-100/90">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-violet-500 via-indigo-500 to-purple-600"
            aria-hidden
          />
          <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-violet-50/30 px-5 py-5 sm:px-7 sm:py-6">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Edit campaign</h2>
            <p className="mt-1 text-sm text-slate-600">Update script, schedule, timezone, status, and lead assignments.</p>
          </div>
          <div className="p-5 sm:p-7 lg:p-8">
            <CampaignForm
              campaign={campaign}
              scripts={scripts}
              onSave={handleSave}
              onCancel={() => navigate('/dashboard/campaigns')}
              saving={saving}
              showSchedule
              showLeadList
              leadList={leadList}
              onLeadListChange={setLeadList}
              availableLeads={availableLeads}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 px-5 py-6 text-sm text-slate-600 ring-1 ring-slate-100/80 sm:px-7">
          This campaign is <span className="font-semibold text-slate-800">read-only</span> for your role. Summary tiles above reflect the latest saved configuration.
        </div>
      )}

      <DeleteCampaignConfirmModal
        open={deleteModalOpen}
        campaignName={campaign.name}
        campaignId={campaign.id}
        onClose={() => !deleteDeleting && setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        deleting={deleteDeleting}
      />
    </div>
  );
}
