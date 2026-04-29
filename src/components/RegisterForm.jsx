import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authGradientButtonBase } from '../constants/authTheme';
import { useAuth } from '../store/authContext';
import { useToast } from '../store/toastContext';
import { hashPassword } from '../utils/passwordHash';
import UiSelect from './UiSelect';

const REGISTER_ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'agent', label: 'Agent' },
  { value: 'viewer', label: 'Viewer' },
];

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none lg:rounded-lg lg:px-3 lg:py-2.5 lg:text-sm';

function EyeIcon({ show }) {
  if (show) {
    return (
      <svg className="h-5 w-5 text-slate-500 lg:h-[18px] lg:w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-slate-500 lg:h-[18px] lg:w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const hashedPassword = await hashPassword(password);
      const result = await register({
        name,
        email,
        password: hashedPassword,
        role,
        phone: phone || undefined,
      });
      if (result?.success) {
        toast.success('Account created successfully.', { title: 'Success' });
        navigate('/dashboard', { replace: true });
      } else {
        const msg = result?.message || 'Registration failed';
        setError(msg);
        toast.error(msg, { title: 'Registration failed' });
      }
    } catch (err) {
      const msg = err.response?.data?.message ?? err.message ?? 'Registration failed';
      setError(msg);
      toast.error(msg, { title: 'Registration failed' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-4 lg:space-y-4">
      <div>
        <h1 className="text-[1.375rem] font-bold leading-tight text-slate-900 sm:text-2xl lg:text-xl lg:font-bold">
          Create account
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-[15px] lg:mt-0.5 lg:text-xs">Set up your workspace.</p>
      </div>
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50/90 px-4 py-3 text-sm text-red-800 lg:rounded-lg lg:px-3 lg:py-2 lg:text-xs">
          <span className="mt-0.5 shrink-0" aria-hidden>
            ⚠
          </span>
          <span>{error}</span>
        </div>
      )}
      <div>
        <label htmlFor="reg-name" className="mb-1.5 block text-sm font-medium text-slate-700 lg:mb-1 lg:text-xs">
          Name
        </label>
        <input
          id="reg-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className={inputClass}
          placeholder="John Doe"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="mb-1.5 block text-sm font-medium text-slate-700 lg:mb-1 lg:text-xs">
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="reg-password" className="mb-1.5 block text-sm font-medium text-slate-700 lg:mb-1 lg:text-xs">
          Password
        </label>
        <div className="relative">
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
            className={inputClass + ' pr-12 lg:pr-10'}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:right-2 lg:p-1"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            <EyeIcon show={showPassword} />
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="reg-phone" className="mb-1.5 block text-sm font-medium text-slate-700 lg:mb-1 lg:text-xs">
          Phone (optional)
        </label>
        <input
          id="reg-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          className={inputClass}
          placeholder="+919876543210"
        />
      </div>
      <div>
        <label htmlFor="reg-role" className="mb-1.5 block text-sm font-medium text-slate-700 lg:mb-1 lg:text-xs">
          Role
        </label>
        <UiSelect
          id="reg-role"
          aria-label="Account role"
          className="w-full"
          value={role}
          onChange={(v) => setRole(v)}
          options={REGISTER_ROLE_OPTIONS}
          placeholder="Role"
          dropdownZClass="z-[200]"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className={`${authGradientButtonBase} mt-1 min-h-[48px] py-3.5 text-base lg:min-h-0 lg:rounded-lg lg:py-2.5 lg:text-sm lg:shadow-md lg:shadow-indigo-950/30`}
      >
        {submitting ? 'Creating account...' : 'Create account'}
      </button>
      <p className="pt-0.5 text-center text-sm text-slate-500 lg:text-xs">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
          Sign in
        </Link>
      </p>
    </form>
  );
}
