import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function handleLogout() {
    setDropdownOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 lg:flex-none" />

      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((o) => !o)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold">
            {(user?.name?.trim() || user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[140px] truncate" title={user?.email}>
            {user?.name?.trim() || user?.email || 'User'}
          </span>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 mt-1 w-48 py-1 bg-white rounded-xl shadow-lg border border-slate-200 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name?.trim() || user?.email || 'User'}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email || '—'}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg mx-1"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
