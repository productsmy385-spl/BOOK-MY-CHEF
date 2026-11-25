import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, MessageSquare, Phone, Plus, Star, Trash2, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { BOOKING_STATUS, dateLabel, money, relativeTime, timeLabel } from '../../lib/format';
import { Alert, Avatar, Badge, Button, Drawer, EmptyState, Field, Modal, Spinner, cx } from '../../components/ui';
import { BookingMenu } from '../../components/menu/MenuBits';

/** First quotation line: the chosen menu (per person × guests) when there is one, else the service. */
function initialQuoteItems(b) {
  const lines = b.menuLines || [];
  if (lines.length) {
    const setLine = lines.find((l) => l.type === 'SET_MENU');
    const perPerson = lines.reduce((s, l) => s + Number(l.unitPricePerPerson), 0);
    return [{ description: `${setLine ? setLine.name : 'Custom menu'} (per person)`, unitPrice: String(perPerson), quantity: String(b.guests || 1) }];
  }
  return [{ description: b.serviceTitle || '', unitPrice: '', quantity: String(b.guests || 1) }];
}

const DETAIL_LABELS = { menu: 'Menu', dietary: 'Food preference', ingredients: 'Ingredients', kitchen: 'Kitchen', occasion: 'Occasion', venue: 'Venue', hours: 'Hours', days: 'Days' };

export default function BookingDetail({ viewer }) {
  const { id } = useParams();
  const qc = useQueryClient();
  const catalog = useCatalog();
  const justCreated = useLocation().state?.justCreated;
  const { data: b, isLoading, error } = useQuery({ queryKey: ['booking', id], queryFn: () => api.bookings.get(id) });
  const [dialog, setDialog] = useState(null);
  const [message, setMessage] = useState('');

  const act = useMutation({
    mutationFn: ({ fn }) => fn(),
    onSuccess: (data) => {
      qc.setQueryData(['booking', id], data);
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setDialog(null);
      setMessage('');
    },
  });
  const run = (fn) => act.mutate({ fn });
  const listPath = viewer === 'PROVIDER' ? '/provider/bookings' : '/bookings';

  if (isLoading) return <Spinner />;
  if (error) return <div className="page py-10"><EmptyState title="Booking not found" action={<Link to={listPath} className="btn btn-outline">All bookings</Link>}>{error.message}</EmptyState></div>;

  const st = BOOKING_STATUS[b.status] || { label: b.status, tone: 'neutral' };
  const can = (a) => b.allowedActions.includes(a);
  const other = viewer === 'PROVIDER'
    ? { name: b.customerName, phone: b.customerPhone, email: b.customerEmail, avatar: null }
    : { name: b.providerName, phone: b.providerPhone, email: b.providerEmail, avatar: b.providerAvatarUrl };
  const amount = b.finalAmount ?? b.estimatedTotal;

  return (
    <div className="page max-w-3xl pb-16">
      <div className="flex items-center gap-2 pt-5">
        <Link to={listPath} className="btn-icon -ml-2" aria-label="All bookings"><ArrowLeft className="w-5 h-5" /></Link>
        <p className="t-small text-muted">Booking {b.reference}</p>
      </div>

      {justCreated && <Alert tone="success" className="mt-3">Request sent. You'll be notified when {b.providerName} responds.</Alert>}
      {viewer === 'CUSTOMER' && b.eventId && b.eventTitle && (
        <Link to={`/events/${b.eventId}`} className="mt-3 flex items-center gap-2 panel px-3 py-2.5 t-small hover:border-sky">
          <CalendarDays className="w-4 h-4 text-navy" aria-hidden /> Part of <strong className="truncate">{b.eventTitle}</strong>
          <span className="ml-auto text-navy font-medium shrink-0">View event</span>
        </Link>
      )}

      <div className="card p-5 mt-4">
        <div className="flex items-start gap-3">
          <Avatar src={other.avatar} name={other.name} size={48} />
          <div className="min-w-0 flex-1">
            <h1 className="t-h3 break-words">{b.serviceTitle}</h1>
            <p className="t-small text-muted">
              {viewer === 'PROVIDER' ? 'Requested by ' : ''}
              {viewer === 'CUSTOMER' ? <Link to={`/p/${b.providerId}`} className="text-navy hover:underline">{b.providerName}</Link> : other.name}
              {' · '}{catalog.categoryLabel(b.category)}
            </p>
          </div>
          <Badge tone={st.tone}>{st.label}</Badge>
        </div>

        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mt-5 t-small">
          <Info icon={CalendarDays} label="When">{dateLabel(b.eventDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}{b.eventTime && `, ${timeLabel(b.eventTime)}`}</Info>
          <Info icon={Users} label="Guests">{b.guests}</Info>
          <Info icon={MapPin} label="Where">{b.eventAddress ? `${b.eventAddress}, ${b.city}` : `${b.city} (full address shared once confirmed)`}</Info>
          <Info label="Service mode">{catalog.modeLabels[b.deliveryMode] || b.deliveryMode}</Info>
          {b.cuisinePreference && <Info label="Cuisine">{b.cuisinePreference}</Info>}
          {b.budget != null && <Info label="Customer budget">{money(b.budget)}</Info>}
          {Object.entries(b.details || {}).map(([k, v]) => <Info key={k} label={DETAIL_LABELS[k] || k}>{v}</Info>)}
        </dl>
        {b.specialInstructions && (
          <div className="mt-4 p-3 rounded-md bg-canvas t-small"><p className="t-caption mb-1">Notes</p><p className="whitespace-pre-line break-words">{b.specialInstructions}</p></div>
        )}

        <div className="mt-5 pt-4 border-t border-line flex items-center justify-between gap-3">
          <div>
            <p className="t-caption">{b.finalAmount != null ? (b.quotation ? 'Quoted price' : 'Agreed price') : b.estimatedTotal != null ? 'Estimated price' : 'Price'}</p>
            <p className="t-metric mt-1">{amount != null ? money(amount) : 'Awaiting quotation'}</p>
          </div>
          {b.paymentStatus === 'NOT_REQUIRED' && ['CONFIRMED', 'COMPLETED'].includes(b.status) && (
            <p className="t-caption text-right max-w-[180px]">Pay the provider directly as agreed.</p>
          )}
        </div>
      </div>

      {b.providerMessage && (
        <div className="panel p-4 mt-4 flex gap-3">
          <MessageSquare className="w-5 h-5 text-navy shrink-0" />
          <div className="min-w-0"><p className="t-caption">Message from {viewer === 'PROVIDER' ? 'you' : b.providerName}</p><p className="t-body mt-0.5 break-words">{b.providerMessage}</p></div>
        </div>
      )}

      <BookingMenu booking={b} catalog={catalog} />
      {b.quotation && <Quotation q={b.quotation} />}

      {(other.phone || other.email) && (
        <div className="panel p-4 mt-4">
          <p className="t-h4 mb-2">Contact {other.name}</p>
          <div className="flex flex-wrap gap-2">
            {other.phone && <a href={`tel:${other.phone}`} className="btn btn-outline btn-sm"><Phone className="w-4 h-4" />{other.phone}</a>}
            {other.email && <a href={`mailto:${other.email}`} className="btn btn-outline btn-sm break-all">{other.email}</a>}
          </div>
        </div>
      )}

      <Alert className="mt-4">{act.error?.message}</Alert>
      {b.allowedActions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-5">
          {can('ACCEPT') && <Button onClick={() => run(() => api.bookings.accept(id))} loading={act.isPending}>Accept booking</Button>}
          {can('QUOTE') && <Button variant={can('ACCEPT') ? 'outline' : 'primary'} onClick={() => setDialog('quote')}>{b.quotation ? 'Revise quotation' : 'Send quotation'}</Button>}
          {can('ACCEPT_QUOTE') && <Button onClick={() => run(() => api.bookings.acceptQuote(id))} loading={act.isPending}>Accept quotation</Button>}
          {can('PAY') && <PayButton bookingId={id} onPaid={() => qc.invalidateQueries({ queryKey: ['booking', id] })} />}
          {can('COMPLETE') && <Button icon={CheckCircle2} onClick={() => run(() => api.bookings.complete(id))} loading={act.isPending}>Mark as completed</Button>}
          {can('REVIEW') && <Button icon={Star} onClick={() => setDialog('review')}>Rate this service</Button>}
          {can('CLARIFY') && <Button variant="outline" onClick={() => setDialog('clarify')}>Ask a question</Button>}
          {can('DECLINE_QUOTE') && <Button variant="danger" onClick={() => setDialog('declineQuote')}>Decline quotation</Button>}
          {can('REJECT') && <Button variant="danger" onClick={() => setDialog('reject')}>Decline request</Button>}
          {can('CANCEL') && <Button variant="danger" onClick={() => setDialog('cancel')}>Cancel booking</Button>}
        </div>
      )}

      <section className="mt-8">
        <h2 className="t-h4 mb-3">History</h2>
        <ol className="border-l-2 border-line ml-1.5 flex flex-col gap-4">
          {b.history.map((h, i) => (
            <li key={i} className="pl-4 relative">
              <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-sky border-2 border-white" />
              <p className="t-small font-medium">{BOOKING_STATUS[h.to]?.label || h.to}</p>
              <p className="t-caption">{relativeTime(h.at)}{h.reason ? ` · ${h.reason}` : ''}</p>
            </li>
          ))}
        </ol>
      </section>

      <ReasonModal open={['reject', 'cancel', 'declineQuote', 'clarify'].includes(dialog)} kind={dialog} value={message} onChange={setMessage}
        onClose={() => setDialog(null)} loading={act.isPending} error={act.error?.message} viewer={viewer}
        onConfirm={() => run(() => ({
          reject: () => api.bookings.reject(id, message),
          cancel: () => api.bookings.cancel(id, message),
          declineQuote: () => api.bookings.declineQuote(id, message),
          clarify: () => api.bookings.clarify(id, message),
        })[dialog]())} />
      <QuoteBuilder open={dialog === 'quote'} onClose={() => setDialog(null)} booking={b}
        onSubmit={(q) => run(() => api.bookings.quote(id, q))} loading={act.isPending} error={act.error?.message} />
      <ReviewModal open={dialog === 'review'} onClose={() => setDialog(null)} bookingId={id}
        onDone={() => { setDialog(null); qc.invalidateQueries({ queryKey: ['booking', id] }); }} />
    </div>
  );
}

function Info({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <dt className="t-caption flex items-center gap-1">{Icon && <Icon className="w-3.5 h-3.5" />}{label}</dt>
      <dd className="mt-0.5 break-words whitespace-pre-line">{children}</dd>
    </div>
  );
}

function Quotation({ q }) {
  const extras = [['Travel', q.travelCharges], ['Ingredients', q.ingredientCharges], ['Additional staff', q.staffCharges]].filter(([, v]) => Number(v) > 0);
  return (
    <section className="panel p-4 mt-4">
      <div className="flex items-center justify-between"><h2 className="t-h4">Quotation v{q.version}</h2><Badge tone={q.status === 'ACCEPTED' ? 'green' : q.status === 'REJECTED' ? 'red' : 'blue'}>{q.status.toLowerCase()}</Badge></div>
      <table className="w-full mt-3 t-small">
        <tbody className="divide-y divide-line">
          {q.items.map((it, i) => (
            <tr key={i}><td className="py-2 pr-2 break-words">{it.description} <span className="text-muted">× {it.quantity}</span></td><td className="py-2 text-right whitespace-nowrap">{money(it.total)}</td></tr>
          ))}
          {extras.map(([l, v]) => <tr key={l}><td className="py-2">{l}</td><td className="py-2 text-right">{money(v)}</td></tr>)}
          <tr className="font-semibold"><td className="py-2">Total</td><td className="py-2 text-right">{money(q.total)}</td></tr>
        </tbody>
      </table>
      {q.notes && <p className="t-small text-muted mt-2 whitespace-pre-line break-words">{q.notes}</p>}
    </section>
  );
}

const REASON_COPY = {
  reject: { title: 'Decline this request?', label: 'Reason (shared with the customer)', confirm: 'Decline request', required: false },
  cancel: { title: 'Cancel this booking?', label: 'Reason', confirm: 'Cancel booking' },
  declineQuote: { title: 'Decline the quotation?', label: 'Reason (optional)', confirm: 'Decline quotation', required: false },
  clarify: { title: 'Ask the customer a question', label: 'Your question', confirm: 'Send', required: true },
};

function ReasonModal({ open, kind, value, onChange, onClose, onConfirm, loading, error, viewer }) {
  if (!open) return null;
  const c = REASON_COPY[kind];
  const required = kind === 'cancel' ? viewer === 'PROVIDER' : c.required;
  return (
    <Modal open title={c.title} onClose={onClose}
      footer={<><Button variant="outline" onClick={onClose}>Back</Button>
        <Button variant={kind === 'clarify' ? 'primary' : 'navy'} loading={loading} disabled={required && !value.trim()} onClick={onConfirm}>{c.confirm}</Button></>}>
      <Field as="textarea" rows={3} label={c.label} value={value} onChange={(e) => onChange(e.target.value)} maxLength={1000} required={required} />
      <Alert className="mt-3">{error}</Alert>
    </Modal>
  );
}

function QuoteBuilder({ open, onClose, booking, onSubmit, loading, error }) {
  const [items, setItems] = useState(() => initialQuoteItems(booking));
  const [extra, setExtra] = useState({ travelCharges: '', ingredientCharges: '', staffCharges: '', notes: '' });
  const num = (v) => Number(v) || 0;
  const total = items.reduce((s, i) => s + num(i.unitPrice) * num(i.quantity), 0) + num(extra.travelCharges) + num(extra.ingredientCharges) + num(extra.staffCharges);
  const valid = items.length && items.every((i) => i.description.trim() && i.unitPrice !== '' && num(i.quantity) >= 1) && total > 0;
  const setItem = (idx, k, v) => setItems((xs) => xs.map((x, i) => (i === idx ? { ...x, [k]: v } : x)));

  return (
    <Drawer open={open} onClose={onClose} title="Quotation"
      footer={<div className="flex items-center justify-between gap-3"><div><p className="t-caption">Total</p><p className="t-h3">{money(total)}</p></div>
        <Button loading={loading} disabled={!valid} onClick={() => onSubmit({
          items: items.map((i) => ({ description: i.description.trim(), unitPrice: num(i.unitPrice), quantity: num(i.quantity) })),
          travelCharges: num(extra.travelCharges), ingredientCharges: num(extra.ingredientCharges), staffCharges: num(extra.staffCharges),
          notes: extra.notes.trim() || undefined })}>Send quotation</Button></div>}>
      <div className="flex flex-col gap-4">
        <p className="t-small text-muted">{booking.guests} guests · {dateLabel(booking.eventDate)}</p>
        {items.map((it, idx) => (
          <div key={idx} className="panel p-3 flex flex-col gap-3">
            <div className="flex gap-2 items-end">
              <Field className="flex-1" label={`Item ${idx + 1}`} value={it.description} onChange={(e) => setItem(idx, 'description', e.target.value)} placeholder="e.g. Veg meals (per plate)" />
              {items.length > 1 && <button className="btn-icon text-danger" aria-label="Remove item" onClick={() => setItems((xs) => xs.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4" /></button>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Unit price (₹)" type="number" min="0" inputMode="decimal" value={it.unitPrice} onChange={(e) => setItem(idx, 'unitPrice', e.target.value)} />
              <Field label="Quantity" type="number" min="1" inputMode="numeric" value={it.quantity} onChange={(e) => setItem(idx, 'quantity', e.target.value)} />
            </div>
          </div>
        ))}
        <Button variant="ghost" icon={Plus} onClick={() => setItems((xs) => [...xs, { description: '', unitPrice: '', quantity: '1' }])}>Add item</Button>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Travel (₹)" type="number" min="0" value={extra.travelCharges} onChange={(e) => setExtra({ ...extra, travelCharges: e.target.value })} />
          <Field label="Ingredients (₹)" type="number" min="0" value={extra.ingredientCharges} onChange={(e) => setExtra({ ...extra, ingredientCharges: e.target.value })} />
          <Field label="Extra staff (₹)" type="number" min="0" value={extra.staffCharges} onChange={(e) => setExtra({ ...extra, staffCharges: e.target.value })} />
        </div>
        <Field as="textarea" rows={3} label="Notes for the customer" value={extra.notes} onChange={(e) => setExtra({ ...extra, notes: e.target.value })} maxLength={2000} />
        <Alert>{error}</Alert>
      </div>
    </Drawer>
  );
}

function ReviewModal({ open, onClose, bookingId, onDone }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const submit = useMutation({ mutationFn: () => api.reviews.submit({ bookingId, overallRating: rating, text: text.trim() || undefined }), onSuccess: onDone });
  return (
    <Modal open={open} onClose={onClose} title="Rate this service"
      footer={<><Button variant="outline" onClick={onClose}>Later</Button><Button disabled={!rating} loading={submit.isPending} onClick={() => submit.mutate()}>Submit review</Button></>}>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="p-1">
            <Star className={cx('w-8 h-8', n <= rating ? 'fill-[#F5A623] text-[#F5A623]' : 'text-line')} />
          </button>
        ))}
      </div>
      <Field as="textarea" rows={4} className="mt-4" label="Tell others about your experience (optional)" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
      <Alert className="mt-3">{submit.error?.message}</Alert>
    </Modal>
  );
}

/** Razorpay checkout, only when the platform has payments configured. */
function PayButton({ bookingId, onPaid }) {
  const config = useQuery({ queryKey: ['paymentsConfig'], queryFn: api.payments.config });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (config.isLoading) return null;
  if (!config.data?.enabled) return <Alert tone="info">Online payment is not available yet. The provider will share payment details.</Alert>;

  const pay = async () => {
    setBusy(true);
    setError('');
    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('Could not load the payment window.'));
          document.body.appendChild(s);
        });
      }
      const order = await api.payments.order(bookingId);
      new window.Razorpay({
        key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency,
        name: 'Book My Chef', description: `Booking ${order.reference}`,
        handler: async (r) => {
          try {
            await api.payments.verify({ orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
            onPaid();
          } catch (e) { setError(e.message); }
        },
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };
  return (
    <>
      <Button onClick={pay} loading={busy}>Pay now</Button>
      {error && <Alert className="w-full">{error}</Alert>}
    </>
  );
}
