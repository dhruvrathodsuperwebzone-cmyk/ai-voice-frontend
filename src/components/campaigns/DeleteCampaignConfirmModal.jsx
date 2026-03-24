/**
 * Confirmation dialog before permanently deleting a campaign.
 */
export default function DeleteCampaignConfirmModal({
  open,
  campaignName,
  campaignId,
  onClose,
  onConfirm,
  deleting = false,
}) {
  if (!open) return null;

  const title = campaignName?.trim() || 'this campaign';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-900/45 p-4 pb-8 backdrop-blur-[2px] sm:items-center sm:pb-4"
      role="presentation"
      onClick={deleting ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20 ring-1 ring-slate-100/90"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-campaign-title"
        aria-describedby="delete-campaign-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-red-100/80 bg-gradient-to-br from-red-50/90 via-white to-orange-50/20 px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 ring-1 ring-red-200/60">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <div className="min-w-0 pt-0.5">
              <h2 id="delete-campaign-title" className="text-lg font-bold tracking-tight text-slate-900">
                Delete campaign?
              </h2>
              <p id="delete-campaign-desc" className="mt-1 text-sm leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-800">{title}</span>
                {campaignId != null && (
                  <span className="text-slate-500"> (ID {campaignId})</span>
                )}{' '}
                will be removed permanently. This cannot be undone.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-red-900/20 transition-opacity hover:from-red-500 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
          >
            {deleting ? 'Deleting…' : 'Delete campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
