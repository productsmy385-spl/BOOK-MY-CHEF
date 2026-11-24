import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

/** Joins class names, skipping falsy values. */
export const cx = (...c) => c.filter(Boolean).join(' ');

export function Button({ variant = 'primary', size, loading, icon: Icon, children, className, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={rest.disabled || loading}
      className={cx('btn', `btn-${variant}`, size && `btn-${size}`, className)}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : Icon && <Icon className="w-4 h-4" aria-hidden />}
      {children}
    </button>
  );
}

export function Spinner({ label = 'Loading', className }) {
  return (
    <div className={cx('flex items-center justify-center gap-2 py-10 text-muted', className)} role="status">
      <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      <span className="t-small">{label}…</span>
    </div>
  );
}

/** Labelled form field. Pass `as="select" | "textarea"` for other controls. */
export function Field({ label, hint, error, as = 'input', children, className, required, ...rest }) {
  const id = useId();
  const Control = as;
  return (
    <div className={cx('flex flex-col gap-1.5 min-w-0', className)}>
      {label && (
        <label htmlFor={id} className="t-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <Control
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error || hint ? `${id}-help` : undefined}
        required={required}
        className={cx('field-input', error && 'field-invalid')}
        {...rest}
      >
        {children}
      </Control>
      {(error || hint) && (
        <p id={`${id}-help`} className={cx('t-caption', error && '!text-danger')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function Checkbox({ label, checked, onChange, description }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer py-1">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-[18px] h-[18px] accent-brand shrink-0" />
      <span className="min-w-0">
        <span className="t-body block">{label}</span>
        {description && <span className="t-caption block">{description}</span>}
      </span>
    </label>
  );
}

export function Alert({ tone = 'error', children, className }) {
  if (!children) return null;
  const styles = {
    error: 'bg-[#FDF2F2] border-[#F3C4C4] text-[#8B1C1C]',
    success: 'bg-[#EFFAF2] border-[#BFE5CB] text-[#14532D]',
    info: 'bg-pale border-sky text-navy',
    warning: 'bg-[#FFF8EB] border-[#F5D9A8] text-[#7A3E06]',
  }[tone];
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('flex gap-2.5 items-start border rounded-md px-3.5 py-3 t-small', styles, className)}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Badge({ tone = 'neutral', children, className }) {
  const styles = {
    neutral: 'bg-canvas text-muted border-line',
    blue: 'bg-pale text-navy border-sky',
    green: 'bg-[#EFFAF2] text-success border-[#BFE5CB]',
    amber: 'bg-[#FFF8EB] text-warning border-[#F5D9A8]',
    red: 'bg-[#FDF2F2] text-danger border-[#F3C4C4]',
  }[tone];
  return (
    <span className={cx('inline-flex items-center gap-1 h-6 px-2 rounded border text-[12px] font-medium whitespace-nowrap', styles, className)}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12 gap-3">
      {Icon && (
        <div className="w-12 h-12 rounded-full bg-pale text-navy flex items-center justify-center">
          <Icon className="w-6 h-6" aria-hidden />
        </div>
      )}
      <h3 className="t-h3">{title}</h3>
      {children && <p className="t-body text-muted max-w-sm">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, back }) {
  return (
    <div className="flex items-start justify-between gap-3 pt-5 pb-4">
      <div className="min-w-0 flex items-start gap-2">
        {back}
        <div className="min-w-0">
          <h1 className="t-h2 break-words">{title}</h1>
          {subtitle && <p className="t-small text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <div className="panel p-4 min-w-0">
      <p className="t-caption truncate">{label}</p>
      <p className="t-metric mt-2 text-ink break-words">{value}</p>
      {hint && <p className="t-caption mt-1.5">{hint}</p>}
    </div>
  );
}

/**
 * Drawer: right-side panel on desktop, bottom sheet on mobile.
 * Locks page scroll and closes on Escape.
 */
export function Drawer({ open, onClose, title, children, footer, side = 'right' }) {
  const panel = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  const position = side === 'left'
    ? 'inset-y-0 left-0 w-[86vw] max-w-[320px] rounded-r-lg'
    : 'inset-x-0 bottom-0 max-h-[92vh] rounded-t-xl sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:bottom-auto sm:h-full sm:max-h-none sm:w-[440px] sm:rounded-none';
  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div ref={panel} tabIndex={-1} className={cx('absolute bg-white shadow-sheet flex flex-col outline-none', position)}>
        <div className="flex items-center justify-between gap-3 px-5 h-14 border-b border-line shrink-0">
          <h2 className="t-h3 truncate">{title}</h2>
          <button className="btn-icon -mr-2" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3 pb-safe shrink-0 bg-white">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Small centered dialog, used for confirmations of destructive actions. */
export function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md rounded-t-xl sm:rounded-lg shadow-sheet max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <h2 className="t-h3">{title}</h2>
          <button className="btn-icon -mr-2" onClick={onClose} aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <div className="px-5 pb-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-line flex justify-end gap-2 pb-safe">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Avatar({ src, name, size = 48, className }) {
  const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return src ? (
    <img src={src} alt="" width={size} height={size} loading="lazy"
      className={cx('rounded-full object-cover bg-canvas shrink-0', className)} style={{ width: size, height: size }} />
  ) : (
    <div aria-hidden className={cx('rounded-full bg-pale text-navy font-heading font-semibold flex items-center justify-center shrink-0', className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export function Tabs({ value, onChange, options }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-line" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}
          className={cx('px-3.5 h-11 text-[14px] font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            value === o.value ? 'border-brand text-navy' : 'border-transparent text-muted hover:text-ink')}>
          {o.label}
          {o.count > 0 && <span className="ml-1.5 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-brand text-white text-[11px]">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pager({ page, total, size, onChange }) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>Previous</Button>
      <span className="t-small text-muted">Page {page + 1} of {pages}</span>
      <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>Next</Button>
    </div>
  );
}
