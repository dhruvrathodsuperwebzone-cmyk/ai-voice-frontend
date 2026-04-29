/**
 * Shared table footer: summary + segmented pagination (First / Previous / Page x of y / Next / Last).
 * Use variant="simple" for Previous + Page + Next only.
 *
 * @param {import('react').ReactNode} [beforeNav]
 * @param {import('react').ReactNode} [summaryExtra]
 */
export function PaginationBar({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPage,
  disabled = false,
  variant = 'full',
  beforeNav = null,
  summaryExtra = null,
  emptyLabel = 'No results',
  className = 'flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6',
  size = 'default',
  hideWhenSinglePage = false,
  showNavWhenEmpty = true,
}) {
  const tp = Math.max(1, Number(totalPages) || 1);
  const count = Number(totalCount) || 0;
  const ps = Math.max(1, Number(pageSize) || 1);

  if (hideWhenSinglePage && tp <= 1) return null;

  const startRow = count === 0 ? 0 : (page - 1) * ps + 1;
  const endRow = count === 0 ? 0 : Math.min(page * ps, count);

  const lead = size === 'compact' ? 'text-xs' : 'text-sm';
  const navBtn = size === 'compact' ? 'px-2.5 py-1.5 text-xs font-semibold' : 'px-3 py-2 text-sm font-medium';

  const showNav = showNavWhenEmpty || count > 0;

  return (
    <div className={className}>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p className={`${lead} text-slate-600`}>
          {count === 0 && !showNavWhenEmpty ? (
            emptyLabel
          ) : (
            <>
              Showing{' '}
              <span className="font-medium text-slate-900 tabular-nums">
                {startRow}–{endRow}
              </span>{' '}
              of <span className="font-medium text-slate-900 tabular-nums">{count}</span>
              {summaryExtra}
            </>
          )}
        </p>
        {beforeNav}
      </div>
      {showNav && (
        <nav
          className="inline-flex w-full max-w-full overflow-hidden rounded-md border border-slate-300 bg-white text-sm shadow-sm sm:w-auto"
          aria-label="Pagination"
        >
          {variant === 'full' && (
            <>
              <button
                type="button"
                onClick={() => onPage(1)}
                disabled={disabled || page <= 1}
                className={`${navBtn} border-r border-slate-200 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white`}
              >
                First
              </button>
              <button
                type="button"
                onClick={() => onPage(Math.max(1, page - 1))}
                disabled={disabled || page <= 1}
                className={`${navBtn} border-r border-slate-200 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white`}
              >
                Previous
              </button>
            </>
          )}
          {variant === 'simple' && (
            <button
              type="button"
              onClick={() => onPage(Math.max(1, page - 1))}
              disabled={disabled || page <= 1}
              className={`${navBtn} border-r border-slate-200 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white`}
            >
              Previous
            </button>
          )}
          <span
            className={`flex min-w-0 flex-1 items-center justify-center border-r border-slate-200 bg-slate-50 px-3 py-2 tabular-nums text-slate-600 sm:flex-none sm:px-5 ${size === 'compact' ? 'text-xs' : 'text-sm'}`}
            aria-current="page"
          >
            Page {page} of {tp}
          </span>
          {variant === 'simple' && (
            <button
              type="button"
              onClick={() => onPage(Math.min(tp, page + 1))}
              disabled={disabled || page >= tp}
              className={`${navBtn} font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white`}
            >
              Next
            </button>
          )}
          {variant === 'full' && (
            <>
              <button
                type="button"
                onClick={() => onPage(Math.min(tp, page + 1))}
                disabled={disabled || page >= tp}
                className={`${navBtn} border-r border-slate-200 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white`}
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => onPage(tp)}
                disabled={disabled || page >= tp}
                className={`${navBtn} font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white`}
              >
                Last
              </button>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
