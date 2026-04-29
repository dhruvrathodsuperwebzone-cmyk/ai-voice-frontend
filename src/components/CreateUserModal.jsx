import { useState, useEffect } from 'react';
import { hashPassword } from '../utils/passwordHash';
import UiSelect from './UiSelect';

const ROLES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'agent', label: 'Agent' },
  { value: 'admin', label: 'Admin' },
];

export default function CreateUserModal({ onClose, onCreated, saving }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('agent');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setFormError('');
  }, [name, email, password, role, phone]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!name.trim() || !email.trim() || !password) {
      setFormError('Name, email, and password are required.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    try {
      const hashedPassword = await hashPassword(password);
      await onCreated({
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
        role,
        phone: phone.trim() || undefined,
      });
      onClose();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Could not create user';
      setFormError(typeof msg === 'string' ? msg : 'Could not create user');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="create-user-title"
      >
        <h3 id="create-user-title" className="text-lg font-semibold text-slate-800 mb-1">
          Create user
        </h3>
        <p className="text-sm text-slate-500 mb-4">Adds a new account </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</div>
          )}

          <div>
            <label htmlFor="cu-name" className="block text-xs font-medium text-slate-600 mb-1">
              Name
            </label>
            <input
              id="cu-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="cu-email" className="block text-xs font-medium text-slate-600 mb-1">
              Email
            </label>
            <input
              id="cu-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="cu-password" className="block text-xs font-medium text-slate-600 mb-1">
              Password
            </label>
            <input
              id="cu-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="cu-role" className="block text-xs font-medium text-slate-600 mb-1">
              Role
            </label>
            <UiSelect
              id="cu-role"
              aria-label="User role"
              value={role}
              onChange={(v) => setRole(v)}
              options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
              placeholder="Role"
              dropdownZClass="z-[200]"
            />
          </div>
          <div>
            <label htmlFor="cu-phone" className="block text-xs font-medium text-slate-600 mb-1">
              Phone <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="cu-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary-gradient rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
