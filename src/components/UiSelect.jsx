import { useEffect, useMemo, useRef, useState } from 'react';

const defaultWrapperClass = 'relative w-full min-w-0';
const defaultButtonClass =
  'flex w-full cursor-pointer items-center justify-between gap-2 rounded-full border border-violet-300/70 bg-gradient-to-b from-white to-violet-50/50 px-4 py-2.5 text-left text-sm font-semibold text-slate-800 shadow-sm shadow-violet-500/5 ring-1 ring-violet-100/70 transition hover:border-violet-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 disabled:cursor-not-allowed disabled:opacity-60';
const defaultListClass =
  'absolute left-0 right-0 top-[calc(100%+0.35rem)] min-w-full max-h-60 overflow-y-auto overflow-x-hidden rounded-xl border border-violet-200/90 bg-white py-1 shadow-xl shadow-indigo-950/12 ring-1 ring-violet-100/80';

/**
 * Themed dropdown (Call Log style): pill trigger, violet menu, no native OS styling.
 * @param {Object} props
 * @param {string} [props.id]
 * @param {string} [props['aria-label']]
 * @param {string|number} props.value — compared with String(option.value)
 * @param {(value: string) => void} props.onChange
 * @param {{ value: string, label: string, disabled?: boolean }[]} props.options
 * @param {boolean} [props.disabled]
 * @param {string} [props.placeholder]
 * @param {string} [props.className] — wrapper
 * @param {string} [props.buttonClassName]
 * @param {string} [props.listClassName]
 * @param {string} [props.dropdownZClass] — e.g. z-[120] inside modals
 */
export default function UiSelect({
  id,
  'aria-label': ariaLabel,
  value,
  onChange,
  options = [],
  disabled = false,
  placeholder = 'Select…',
  className = '',
  buttonClassName = '',
  listClassName = '',
  dropdownZClass = 'z-50',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const strValue = value == null ? '' : String(value);

  const displayLabel = useMemo(() => {
    const hit = options.find((o) => String(o.value) === strValue);
    if (hit && !hit.disabled) return hit.label;
    if (hit && hit.disabled) return hit.label;
    return placeholder;
  }, [options, strValue, placeholder]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const hasSelectable = options.some((o) => !o.disabled);
  const canOpen = !disabled && options.length > 0 && hasSelectable;

  return (
    <div ref={rootRef} className={`${defaultWrapperClass} ${className}`.trim()}>
      <button
        type="button"
        id={id}
        disabled={disabled || !hasSelectable}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? undefined}
        onClick={() => {
          if (!canOpen) return;
          setOpen((o) => !o);
        }}
        className={`${defaultButtonClass} ${buttonClassName}`.trim()}
      >
        <span className="min-w-0 truncate">{displayLabel}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-violet-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && canOpen ? (
        <ul
          role="listbox"
          aria-label={ariaLabel ? `${ariaLabel} options` : 'Options'}
          className={`${defaultListClass} ${dropdownZClass} ${listClassName}`.trim()}
        >
          {options.map((opt) => {
            const ov = String(opt.value);
            const optDisabled = !!opt.disabled;
            const selected = strValue === ov && !optDisabled;
            return (
              <li key={`${ov}__${opt.label}`} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={optDisabled}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? 'bg-gradient-to-r from-violet-100/95 to-indigo-50/90 text-violet-950'
                      : 'text-slate-700 hover:bg-violet-50/90 hover:text-slate-900'
                  }`}
                  onClick={() => {
                    if (optDisabled) return;
                    onChange(ov);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 truncate">{opt.label}</span>
                  {selected ? (
                    <svg
                      className="h-4 w-4 shrink-0 text-violet-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
