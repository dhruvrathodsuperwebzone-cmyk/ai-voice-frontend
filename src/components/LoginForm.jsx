import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authGradientButtonBase } from '../constants/authTheme';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { hashPassword } from '../utils/passwordHash';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none lg:text-[15px]';

function EyeIcon({ show }) {
  if (show) {
    return (
      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const hashedPassword = await hashPassword(password);
      const result = await login(email, hashedPassword);
      if (result?.success) {
        toast.success('Signed in successfully.', { title: 'Success' });
        navigate(from, { replace: true });
      } else {
        const msg = result?.message || 'Login failed';
        setError(msg);
        toast.error(msg, { title: 'Sign in failed' });
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? 'Login failed';
      setError(msg);
      toast.error(msg, { title: 'Sign in failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-[1.375rem] font-bold leading-tight text-slate-900 sm:text-2xl">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-[15px] lg:text-sm">Use your email and password to continue.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50/90 border border-red-100 px-4 py-3 text-sm text-red-800">
          <span className="shrink-0 mt-0.5" aria-hidden>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <div className="mb-1.5 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
            <label htmlFor="login-password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="w-fit text-sm font-medium text-blue-700 hover:text-blue-800 sm:shrink-0"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputClass + ' pr-12'}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <EyeIcon show={showPassword} />
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={`${authGradientButtonBase} min-h-[48px] py-3.5 text-base lg:min-h-0 lg:text-[15px]`}
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-blue-700 hover:text-blue-800">
          Create one
        </Link>
      </p>
    </form>
  );
}
