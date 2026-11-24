const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function money(value) {
  if (value === null || value === undefined || value === '') return '—';
  return inr.format(Number(value));
}

export function priceLabel(amount, pricingModel, pricingLabels = {}) {
  if (pricingModel === 'CUSTOM_QUOTE' || amount === null || amount === undefined) return 'Price on request';
  const unit = pricingLabels[pricingModel] || '';
  return `${money(amount)}${unit ? ` ${unit}` : ''}`;
}

export function dateLabel(iso, opts = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', opts);
}

export function timeLabel(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function relativeTime(iso) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} d ago`;
  return dateLabel(iso);
}

/** Local YYYY-MM-DD (not UTC) for date inputs. */
export function isoDate(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function addDays(n, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return d;
}

export const BOOKING_STATUS = {
  PENDING_PROVIDER_CONFIRMATION: { label: 'Requested', tone: 'amber' },
  QUOTATION_SENT: { label: 'Quotation received', tone: 'blue' },
  PENDING_PAYMENT: { label: 'Awaiting payment', tone: 'amber' },
  CONFIRMED: { label: 'Confirmed', tone: 'green' },
  IN_PROGRESS: { label: 'In progress', tone: 'green' },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
  PROVIDER_REJECTED: { label: 'Declined', tone: 'red' },
  CUSTOMER_CANCELLED: { label: 'Cancelled', tone: 'red' },
  PROVIDER_CANCELLED: { label: 'Cancelled by provider', tone: 'red' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
  DISPUTED: { label: 'Disputed', tone: 'red' },
};

export const VERIFICATION = {
  PENDING: { label: 'Verification pending', tone: 'amber' },
  VERIFIED: { label: 'Verified', tone: 'green' },
  REJECTED: { label: 'Verification rejected', tone: 'red' },
  SUSPENDED: { label: 'Suspended', tone: 'red' },
};

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
