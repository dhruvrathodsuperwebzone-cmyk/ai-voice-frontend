/**
 * Centered spinner + optional label for page sections, tables, and modals.
 * @param {{ message?: string, className?: string, size?: 'sm' | 'md' | 'lg' }} props
 */
export default function PageLoader({ message = 'Loading…', className = '', size = 'md' }) {
  const spin =
    size === 'sm'
      ? 'h-6 w-6 border-2'
      : size === 'lg'
        ? 'h-12 w-12 border-[3px]'
        : 'h-10 w-10 border-2';
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={`animate-spin rounded-full border-indigo-600 border-t-transparent ${spin}`}
        aria-hidden
      />
      {message ? <p className="text-center text-sm font-medium text-slate-600">{message}</p> : null}
    </div>
  );
}

/** Tiny spinner for pills, buttons, or table cells */
export function SpinnerDot({ className = '' }) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-90 ${className}`}
      aria-hidden
    />
  );
}
