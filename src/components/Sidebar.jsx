import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';

const ICONS = {
  dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  calls: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  leads: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  campaigns: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  scripts: 'M4 6a2 2 0 012-2h7a2 2 0 012 2v2h3a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm11 4V6a1 1 0 00-1-1H6a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1v-8a1 1 0 00-1-1h-3z',
  payments: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
};

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
  { to: '/dashboard/calls', label: 'Calls', icon: ICONS.calls },
  { to: '/dashboard/leads', label: 'Leads', icon: ICONS.leads },
  { to: '/dashboard/analytics', label: 'Analytics', icon: ICONS.analytics },
  { to: '/dashboard/campaigns', label: 'Campaigns', icon: ICONS.campaigns },
  { to: '/dashboard/scripts', label: 'Scripts', icon: ICONS.scripts },
  { to: '/dashboard/payments', label: 'Payments', icon: ICONS.payments },
  { to: '/dashboard/users', label: 'Users', icon: ICONS.users },
];

function getNavItemsForRole(role) {
  if (role === 'viewer') {
    return allNavItems.filter((i) => ['/dashboard', '/dashboard/calls', '/dashboard/leads', '/dashboard/analytics'].includes(i.to));
  }
  if (role === 'agent') {
    return allNavItems.filter((i) => ['/dashboard', '/dashboard/calls', '/dashboard/leads'].includes(i.to));
  }
  return allNavItems;
}

function NavIcon({ d }) {
  return (
    <svg
      className="h-5 w-5 shrink-0 [display:block]"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/** On large screens, labels show when the sidebar is hovered or focus-within (icon-only rail otherwise). */
function NavLabel({ children }) {
  return (
    <span
      className={`
        min-w-0 shrink truncate text-sm font-medium
        transition-[opacity,max-width] duration-200 ease-out
        lg:max-w-0 lg:overflow-hidden lg:opacity-0
        lg:group-hover/sidebar:max-w-[11rem] lg:group-hover/sidebar:opacity-100
        lg:group-focus-within/sidebar:max-w-[11rem] lg:group-focus-within/sidebar:opacity-100
      `}
    >
      {children}
    </span>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user } = useAuth();
  const role = getRole(user);
  const navItems = getNavItemsForRole(role);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`
          group/sidebar fixed top-0 left-0 z-50 h-full min-h-[100dvh] shrink-0
          border-r border-violet-500/25 bg-gradient-to-b from-slate-900 via-indigo-950 to-violet-950
          shadow-xl shadow-indigo-950/40 transition-[width,transform] duration-200 ease-out
          w-64 -translate-x-full
          lg:static lg:z-0 lg:h-full lg:translate-x-0 lg:shadow-none
          lg:w-[4.25rem] lg:hover:w-64 lg:focus-within:w-64
          ${isOpen ? 'translate-x-0' : ''}
        `}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 120% 80% at 0% 0%, rgb(139 92 246 / 0.22), transparent 55%), radial-gradient(ellipse 90% 70% at 100% 100%, rgb(99 102 241 / 0.18), transparent 50%)',
          }}
          aria-hidden
        />
        <div className="relative flex h-full min-h-0 flex-col">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 lg:justify-center lg:gap-0 lg:px-2 lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-5 lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-3 lg:group-focus-within/sidebar:px-5">
            <Link
              to="/dashboard"
              onClick={onClose}
              className="flex min-w-0 items-center gap-3 rounded-lg py-1 outline-none ring-violet-400/50 transition-opacity hover:opacity-95 focus-visible:ring-2 lg:w-full lg:justify-center lg:group-hover/sidebar:justify-start lg:group-focus-within/sidebar:justify-start"
              aria-label="Voice Agent home"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 via-indigo-600 to-purple-950 shadow-lg shadow-indigo-950/50 ring-2 ring-white/20">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span
                className={`
                  truncate text-lg font-bold tracking-tight text-white
                  transition-[opacity,max-width] duration-200 ease-out
                  lg:max-w-0 lg:overflow-hidden lg:opacity-0
                  lg:group-hover/sidebar:max-w-[10rem] lg:group-hover/sidebar:opacity-100
                  lg:group-focus-within/sidebar:max-w-[10rem] lg:group-focus-within/sidebar:opacity-100
                `}
              >
                Voice Agent
              </span>
            </Link>
          </div>
          <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-x-hidden overflow-y-auto px-3 py-4 lg:items-center lg:px-2 lg:group-hover/sidebar:items-stretch lg:group-hover/sidebar:px-3 lg:group-focus-within/sidebar:items-stretch lg:group-focus-within/sidebar:px-3">
            {navItems.map((item) => {
              const active =
                location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  aria-label={item.label}
                  onClick={onClose}
                  className={`
                    flex w-full max-w-full items-center rounded-xl border transition-all duration-150
                    gap-3 px-3 py-2.5
                    lg:mx-auto lg:h-11 lg:w-11 lg:shrink-0 lg:justify-center lg:gap-0 lg:p-0
                    lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:h-auto lg:group-hover/sidebar:w-full
                    lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3 lg:group-hover/sidebar:py-2.5
                    lg:group-focus-within/sidebar:mx-0 lg:group-focus-within/sidebar:h-auto lg:group-focus-within/sidebar:w-full
                    lg:group-focus-within/sidebar:justify-start lg:group-focus-within/sidebar:gap-3 lg:group-focus-within/sidebar:px-3 lg:group-focus-within/sidebar:py-2.5
                    ${active
                      ? 'border-violet-400/35 bg-gradient-to-r from-violet-500/25 to-indigo-600/20 text-white shadow-md shadow-black/20 lg:bg-gradient-to-br lg:from-violet-500/30 lg:to-indigo-600/25'
                      : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center lg:h-9 lg:w-9">
                    <NavIcon d={item.icon} />
                  </span>
                  <NavLabel>{item.label}</NavLabel>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
