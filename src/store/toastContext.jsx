import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

function ToastItem({ toast, onClose }) {
  const tone =
    toast.type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : 'border-red-200 bg-red-50 text-red-900';

  const icon = toast.type === 'success' ? '✓' : '⚠';

  return (
    <div
      role="status"
      className={`pointer-events-auto w-full rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm sm:max-w-sm ${tone}`}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 text-base font-semibold" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
          <p className={`text-sm ${toast.title ? 'mt-0.5' : ''}`}>{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onClose(toast.id)}
          className="shrink-0 rounded-md px-1 text-base/none opacity-70 transition-opacity hover:opacity-100"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const seq = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = 'success', title = '', message, duration = 3500 }) => {
      if (!message || typeof message !== 'string') return;

      const id = `toast-${Date.now()}-${seq.current++}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      window.setTimeout(() => removeToast(id), Math.max(1200, duration));
    },
    [removeToast]
  );

  const success = useCallback(
    (message, options = {}) => addToast({ ...options, message, type: 'success' }),
    [addToast]
  );
  const error = useCallback(
    (message, options = {}) => addToast({ ...options, message, type: 'error' }),
    [addToast]
  );

  const value = useMemo(
    () => ({ addToast, success, error, removeToast }),
    [addToast, success, error, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-[110] flex w-[min(26rem,calc(100vw-1.5rem))] flex-col gap-2 sm:right-5 sm:top-5">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
