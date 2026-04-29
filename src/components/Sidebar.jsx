import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineCalendar,
  HiOutlineChartBar,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineClipboardDocumentList,
  HiOutlineCpuChip,
  HiOutlineCreditCard,
  HiOutlineHome,
  HiOutlinePhone,
  HiOutlineUserGroup,
} from 'react-icons/hi2';
import { useAuth } from '../store/authContext';
import { getRole } from '../utils/roleUtils';

const navIconClass = 'h-5 w-5 shrink-0 [display:block]';

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
  { to: '/dashboard/calls', label: 'Calls', icon: HiOutlinePhone },
  { to: '/dashboard/leads', label: 'Leads', icon: HiOutlineUserGroup },
  { to: '/dashboard/analytics', label: 'Analytics', icon: HiOutlineChartBar },
  { to: '/dashboard/calendar', label: 'Calendar', icon: HiOutlineCalendar },
  { to: '/dashboard/all-log', label: 'Call Log', icon: HiOutlineClipboardDocumentList },
  { to: '/dashboard/payments', label: 'Payments', icon: HiOutlineCreditCard },
  { to: '/dashboard/agents', label: 'Agents', icon: HiOutlineCpuChip },
  { to: '/dashboard/users', label: 'Users', icon: HiOutlineUserGroup },
];

const viewerHiddenNavPaths = new Set(['/dashboard/calls']);

function getNavItemsForRole(role) {
  if (role === 'viewer') {
    /** Same as admin except hidden items (sidebar + matching route guards). */
    return allNavItems.filter((i) => !viewerHiddenNavPaths.has(i.to));
  }
  if (role === 'agent') {
    return allNavItems.filter((i) =>
      [
        '/dashboard',
        '/dashboard/calls',
        '/dashboard/leads',
        '/dashboard/agents',
        '/dashboard/calendar',
        '/dashboard/all-log',
        '/dashboard/payments',
      ].includes(i.to)
    );
  }
  return allNavItems;
}

function NavLabel({ children, collapsed }) {
  return (
    <span className={`min-w-0 shrink truncate text-sm font-medium ${collapsed ? 'lg:hidden' : ''}`}>{children}</span>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = getRole(user);
  const navItems = getNavItemsForRole(role);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const displayName = user?.name?.trim() || user?.email || 'User';
  const parts = displayName.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  const CollapseChevron = desktopCollapsed ? HiOutlineChevronRight : HiOutlineChevronLeft;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
    onClose?.();
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full min-h-[100dvh] shrink-0
          border-r border-violet-500/25 bg-gradient-to-b from-slate-900 via-indigo-950 to-violet-950
          shadow-xl shadow-indigo-950/40 transition-[width,transform] duration-200 ease-out
          w-64 -translate-x-full
          lg:sticky lg:top-0 lg:z-[41] lg:h-[100dvh] lg:max-h-[100dvh] lg:min-h-0 lg:translate-x-0 lg:overflow-visible lg:shadow-none
          ${desktopCollapsed ? 'lg:w-[4.25rem]' : 'lg:w-64'}
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
          <div className="relative flex shrink-0 items-center border-b border-white/10 px-3 py-3 sm:px-4">
            <Link
              to="/dashboard"
              onClick={onClose}
              className={`flex min-w-0 w-full items-center gap-3 rounded-lg py-0.5 outline-none ring-violet-400/50 transition-opacity hover:opacity-95 focus-visible:ring-2 ${desktopCollapsed ? 'lg:justify-center lg:gap-0' : ''}`}
              aria-label="Voice Agent home"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/95 p-1 shadow-lg shadow-indigo-950/50 ring-2 ring-white/25">
                <img
                  src="/voice-recognition_13320489.png"
                  alt=""
                  className="h-full w-full object-contain"
                  decoding="async"
                  draggable={false}
                  aria-hidden
                />
              </div>
              <span
                className={`min-w-0 truncate text-base font-bold leading-tight tracking-tight text-white sm:text-lg ${desktopCollapsed ? 'lg:hidden' : ''}`}
              >
                Voice Agent
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setDesktopCollapsed((c) => !c)}
              className={`
                pointer-events-auto absolute top-1/2 left-full z-[50] hidden h-10 w-10 min-h-10 min-w-10 shrink-0
                -translate-x-1/2 -translate-y-1/2
                box-border items-center justify-center rounded-full border border-slate-800 bg-[#0a0a0a] p-0 opacity-100
                text-white shadow-[0_2px_4px_rgb(0_0_0/0.4),0_8px_20px_-8px_rgb(0_0_0/0.35)]
                transition-[border-color,color,box-shadow,transform,background-color] duration-200 ease-out
                hover:border-slate-600 hover:bg-[#171717] hover:text-white
                active:scale-[0.96]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/55 focus-visible:ring-offset-0
                lg:inline-flex
              `}
              aria-expanded={!desktopCollapsed}
              aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <CollapseChevron className="block h-4 w-4 shrink-0" strokeWidth={2.15} aria-hidden />
            </button>
          </div>

          <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-3 max-lg:overscroll-y-contain sm:px-3">
            {navItems.map((item) => {
              const active =
                location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
              const Icon = item.icon;
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
                    ${desktopCollapsed ? 'lg:justify-center lg:gap-0 lg:px-2' : ''}
                    ${active
                      ? 'border-violet-400/35 bg-gradient-to-r from-violet-500/25 to-indigo-600/20 text-white shadow-md shadow-black/20'
                      : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                    <Icon className={navIconClass} strokeWidth={1.8} aria-hidden />
                  </span>
                  <NavLabel collapsed={desktopCollapsed}>{item.label}</NavLabel>
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0 border-t border-white/10 px-2 py-3 sm:px-3">
            <div className={desktopCollapsed ? 'max-lg:block lg:hidden' : 'block'}>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-inner shadow-black/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-800 text-xs font-bold text-white ring-2 ring-white/20">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-400">{user?.email || role || '—'}</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
              >
                <HiOutlineArrowRightOnRectangle className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                Sign out
              </button>
            </div>
            {desktopCollapsed ? (
              <div className="hidden flex-col items-center gap-2 lg:flex">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-indigo-600 to-purple-800 text-xs font-bold text-white ring-2 ring-white/20"
                  title={displayName}
                >
                  {initials}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <HiOutlineArrowRightOnRectangle className="h-4 w-4" strokeWidth={2} aria-hidden />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
