import { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Forgot password page. Backend API for reset can be wired here when available.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    // TODO: POST /auth/forgot-password when API is ready
    setTimeout(() => {
      setSent(true);
      setSubmitting(false);
    }, 800);
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-slate-800">Check your email</h1>
        <p className="text-slate-600 text-sm">
          If an account exists for <strong>{email}</strong>, we&apos;ve sent instructions to reset your password.
        </p>
        <Link
          to="/login"
          className="block text-center text-indigo-600 hover:text-indigo-700 font-medium text-sm"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-800">Forgot password</h1>
      <p className="text-slate-600 text-sm">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary-gradient w-full rounded-lg py-2.5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Sending...' : 'Send reset link'}
      </button>
      <p className="text-center text-sm text-slate-600">
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
