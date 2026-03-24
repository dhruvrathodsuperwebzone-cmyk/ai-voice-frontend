import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/dashboard/calls': 'Calls',
  '/dashboard/leads': 'Leads',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/campaigns': 'Campaigns',
  '/dashboard/campaigns/new': 'New campaign',
  '/dashboard/scripts': 'Scripts',
  '/dashboard/scripts/new': 'New script',
  '/dashboard/payments': 'Payments',
  '/dashboard/users': 'Users',
};

function getPageTitle(pathname) {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.startsWith('/dashboard/campaigns/') && pathname !== '/dashboard/campaigns' && pathname !== '/dashboard/campaigns/new') {
    return 'Campaign details';
  }
  if (pathname.startsWith('/dashboard/scripts/') && pathname !== '/dashboard/scripts' && pathname !== '/dashboard/scripts/new') {
    return 'Script builder';
  }
  return 'Dashboard';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const pageTitle = getPageTitle(location.pathname);

  function handleLogout() {
    setDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  const displayName = user?.name?.trim() || user?.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const greeting = getGreeting();

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-violet-200/40 bg-white/75 shadow-[0_1px_0_rgb(139_92_246/0.06),0_8px_32px_-8px_rgb(49_46_129/0.12)] backdrop-blur-xl backdrop-saturate-150">
      {/* Clip only ambient layers — not the user menu (absolute dropdown below the bar). */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-violet-400/15 blur-3xl" />
        <div className="absolute -right-16 -top-24 h-40 w-64 rounded-full bg-indigo-400/12 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      </div>

      <div className="relative mx-auto flex h-[3.35rem] max-w-[100rem] items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:gap-5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-600 shadow-sm ring-1 ring-slate-100/80 transition-all hover:-translate-y-0.5 hover:border-violet-300/70 hover:bg-gradient-to-br hover:from-violet-50 hover:to-indigo-50/80 hover:text-violet-800 hover:shadow-md hover:shadow-violet-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 active:translate-y-0 lg:hidden"
            aria-label="Open menu"
          >
            <svg
              className="h-5 w-5 transition-transform group-hover:scale-105"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden h-10 w-px shrink-0 bg-gradient-to-b from-transparent via-violet-200/80 to-transparent sm:block lg:hidden" aria-hidden />

          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div
              className="hidden h-11 w-1 shrink-0 rounded-full bg-gradient-to-b from-violet-500 via-indigo-500 to-purple-700 shadow-sm shadow-violet-500/30 sm:block sm:h-12"
              aria-hidden
            />
            <div className="min-w-0 py-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600/95">Workspace</p>
                <span className="hidden h-1 w-1 rounded-full bg-violet-400/70 sm:inline" aria-hidden />
                <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
                  {greeting},{' '}
                  <span className="bg-gradient-to-r from-violet-700 to-indigo-700 bg-clip-text font-semibold text-transparent">{firstName}</span>
                </p>
              </div>
              <h1 className="mt-0.5 truncate text-[1.05rem] font-extrabold leading-tight tracking-tight sm:text-xl">
                <span className="bg-gradient-to-r from-slate-900 via-indigo-900 to-violet-800 bg-clip-text text-transparent drop-shadow-sm">
                  {pageTitle}
                </span>
              </h1>
            </div>
          </div>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className={`group flex items-center gap-2 rounded-2xl border bg-white/95 py-1 pl-1 pr-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 sm:gap-2.5 sm:pl-1.5 sm:pr-3 ${
              dropdownOpen
                ? 'border-violet-400/70 shadow-lg shadow-violet-500/12 ring-2 ring-violet-200/50'
                : 'border-slate-200/80 ring-1 ring-slate-100/70 hover:border-violet-300/60 hover:shadow-md hover:shadow-indigo-950/[0.06]'
            }`}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <span className="relative shrink-0">
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-sm" title="Signed in" aria-hidden />
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-800 text-sm font-bold text-white shadow-md shadow-indigo-900/30 ring-2 ring-white transition-transform duration-200 group-hover:scale-[1.04] group-hover:shadow-lg group-hover:shadow-violet-500/25">
                {initial}
              </span>
            </span>
            <span className="hidden max-w-[148px] truncate text-sm font-semibold text-slate-800 sm:block">{displayName}</span>
            <svg
              className={`hidden h-4 w-4 shrink-0 text-violet-400/90 transition-transform duration-200 sm:block ${dropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-[100]" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
              <div className="dashboard-navbar-dropdown absolute right-0 z-[110] mt-2 w-[17rem] overflow-hidden rounded-2xl border border-violet-200/50 bg-white/98 py-1 shadow-2xl shadow-indigo-950/20 ring-1 ring-violet-100/90 backdrop-blur-md">
                <div className="relative overflow-hidden border-b border-violet-100/80 bg-gradient-to-br from-violet-100/35 via-white to-indigo-50/50 px-4 py-3.5">
                  <div className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-violet-400/20 blur-2xl" aria-hidden />
                  <p className="relative truncate text-sm font-bold text-slate-900">{displayName}</p>
                  <p className="relative mt-1 truncate text-xs text-slate-500">{user?.email || '—'}</p>
                  <p className="relative mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 motion-safe:animate-pulse" aria-hidden />
                    Active session
                  </p>
                </div>
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50/80 hover:text-red-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors group-hover:bg-red-100 group-hover:text-red-600">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </span>
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
