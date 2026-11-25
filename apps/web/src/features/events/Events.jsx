import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, CheckCircle2, Circle, Clock, MapPin, Pencil, Plus, Search, Trash2, Users, Wallet, X } from 'lucide-react';
import { api, toQuery } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { useAuthStore } from '../../stores/useAuthStore';
import { setPlanningEvent } from '../../hooks/usePlanningEvent';
import { BOOKING_STATUS, dateLabel, isoDate, money, timeLabel } from '../../lib/format';
import { lookFor, occasionLook } from '../../components/marketing/visuals';
import { Alert, Avatar, Badge, Button, Drawer, EmptyState, Field, Modal, PageHeader, Spinner, cx } from '../../components/ui';

const daysUntil = (iso) => Math.round((new Date(`${iso}T00:00:00`) - new Date(`${isoDate()}T00:00:00`)) / 86400000);
const countdown = (iso) => {
  const d = daysUntil(iso);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  return d > 0 ? `In ${d} days` : `${-d} days ago`;
};
const EVENT_STATUS = { PLANNING: { label: 'Planning', tone: 'blue' }, COMPLETED: { label: 'Completed', tone: 'green' }, CANCELLED: { label: 'Cancelled', tone: 'red' } };
const NEED_STATE = { NOT_STARTED: { label: 'To book', tone: 'neutral' }, REQUESTED: { label: 'Requested', tone: 'amber' }, BOOKED: { label: 'Booked', tone: 'green' } };

function OccasionIcon({ type, size = 44 }) {
  const look = occasionLook(type);
  return (
    <span className="rounded-md flex items-center justify-center shrink-0" style={{ width: size, height: size, background: look.bg, color: look.fg }}>
      <look.icon style={{ width: size * 0.5, height: size * 0.5 }} aria-hidden />
    </span>
  );
}

// ================================================================== list

export function EventList() {
  const catalog = useCatalog();
  const { data, isLoading, error } = useQuery({ queryKey: ['events'], queryFn: api.events.list });
  if (isLoading) return <Spinner />;
  return (
    <div className="page max-w-3xl pb-12">
      <PageHeader title="My events" subtitle="Plan every service for an occasion and track the budget in one place."
        action={<Link to="/events/new" className="btn btn-primary btn-sm"><Plus className="w-4 h-4" />New event</Link>} />
      <Alert>{error?.message}</Alert>
      {!data?.length ? (
        <div className="panel">
          <EmptyState icon={CalendarDays} title="No events yet" action={<Link to="/events/new" className="btn btn-primary">Plan an event</Link>}>
            Tell us the occasion, date and guests. We suggest the services you need, and you book and track each one here.
          </EmptyState>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((e) => {
            const st = EVENT_STATUS[e.status];
            const progress = e.needsTotal ? Math.round((e.needsBooked / e.needsTotal) * 100) : 0;
            return (
              <li key={e.id}>
                <Link to={`/events/${e.id}`} className={cx('panel p-4 flex items-center gap-3 hover:border-sky', e.status !== 'PLANNING' && 'opacity-75')}>
                  <OccasionIcon type={e.eventType} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 flex-wrap"><span className="t-h4 break-words">{e.title}</span><Badge tone={st.tone}>{st.label}</Badge></span>
                    <span className="t-caption block mt-0.5">{catalog.eventTypeLabels[e.eventType]} · {dateLabel(e.eventDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      {e.status === 'PLANNING' && ` · ${countdown(e.eventDate)}`} · {e.guests} guests</span>
                    {e.needsTotal > 0 && (
                      <span className="flex items-center gap-2 mt-2">
                        <span className="h-1.5 flex-1 rounded-full bg-canvas overflow-hidden"><span className="block h-full bg-success" style={{ width: `${progress}%` }} /></span>
                        <span className="t-caption shrink-0">{e.needsBooked}/{e.needsTotal} booked</span>
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ================================================================== create / edit form

function EventForm({ initial, onSubmit, submitting, error, submitLabel, showNeeds }) {
  const catalog = useCatalog();
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e?.target ? e.target.value : e }));
  const type = catalog.eventTypes.find((t) => t.code === f.eventType);

  const pickType = (code) => {
    const t = catalog.eventTypes.find((x) => x.code === code);
    setF((x) => ({ ...x, eventType: code, needs: t ? [...t.suggested] : x.needs,
      title: !x.title || x.autoTitle ? `${t?.label || ''}` : x.title, autoTitle: !x.title || x.autoTitle }));
  };

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.eventType) er.eventType = 'Choose the occasion.';
    if (!f.title.trim()) er.title = 'Give your event a name.';
    if (!f.eventDate) er.eventDate = 'Choose the date.';
    if (!(Number(f.guestCount) >= 1)) er.guestCount = 'Enter the number of guests.';
    if (!f.city.trim()) er.city = 'Enter the city.';
    setErrors(er);
    if (Object.keys(er).length) return;
    onSubmit({
      title: f.title.trim(), eventType: f.eventType, eventDate: f.eventDate, eventTime: f.eventTime || null, city: f.city.trim(),
      venue: f.venue.trim() || null, guestCount: Number(f.guestCount), budget: f.budget === '' ? null : Number(f.budget),
      notes: f.notes.trim() || null, ...(showNeeds ? { needs: f.needs } : {}),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-7">
      <fieldset>
        <legend className="t-h4 mb-3">What's the occasion?</legend>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" role="radiogroup">
          {catalog.eventTypes.map((t) => {
            const look = occasionLook(t.code);
            const on = f.eventType === t.code;
            return (
              <button type="button" key={t.code} role="radio" aria-checked={on} onClick={() => pickType(t.code)}
                className={cx('rounded-md p-3 flex flex-col items-center gap-2 text-center border-2 transition-colors', on ? 'border-brand' : 'border-transparent')}
                style={{ background: look.bg, color: look.fg }}>
                <look.icon className="w-6 h-6" aria-hidden />
                <span className="text-[12px] font-semibold leading-tight">{t.label}</span>
              </button>
            );
          })}
        </div>
        {errors.eventType && <p className="t-caption !text-danger mt-2">{errors.eventType}</p>}
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field className="sm:col-span-2" label="Event name" value={f.title} onChange={(e) => setF((x) => ({ ...x, title: e.target.value, autoTitle: false }))}
          error={errors.title} maxLength={120} required placeholder="e.g. Priya & Arjun's wedding reception" />
        <Field label="Date" type="date" min={initial.id ? undefined : isoDate()} value={f.eventDate} onChange={set('eventDate')} error={errors.eventDate} required />
        <Field label="Start time" type="time" value={f.eventTime} onChange={set('eventTime')} hint="Optional" />
        <Field label="Guests" type="number" min="1" inputMode="numeric" value={f.guestCount} onChange={set('guestCount')} error={errors.guestCount} required />
        <Field label="Total budget (₹)" type="number" min="0" inputMode="numeric" value={f.budget} onChange={set('budget')} hint="Optional — used for the budget tracker" />
        <Field label="City" value={f.city} onChange={set('city')} error={errors.city} required />
        <Field label="Venue or area" value={f.venue} onChange={set('venue')} maxLength={500} hint="Optional" />
        <Field as="textarea" rows={2} className="sm:col-span-2" label="Notes" value={f.notes} onChange={set('notes')} maxLength={2000} />
      </div>

      {showNeeds && f.eventType && (
        <fieldset>
          <legend className="t-h4">Services you need</legend>
          <p className="t-small text-muted mt-1 mb-3">{type?.suggested.length ? `Suggested for a ${type.label.toLowerCase()}. Tap to add or remove.` : 'Pick the services you need.'}</p>
          <div className="flex flex-wrap gap-2">
            {catalog.categories.map((c) => {
              const on = f.needs.includes(c.code);
              const look = lookFor(c.code);
              return (
                <button type="button" key={c.code} aria-pressed={on} className={cx('chip', on && 'chip-active')}
                  onClick={() => setF((x) => ({ ...x, needs: on ? x.needs.filter((n) => n !== c.code) : [...x.needs, c.code] }))}>
                  <look.icon className="w-4 h-4" aria-hidden />{c.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <Alert>{error}</Alert>
      <Button type="submit" size="lg" loading={submitting}>{submitLabel}</Button>
    </form>
  );
}

const blank = (account, type) => ({ eventType: type || '', title: '', autoTitle: true, eventDate: '', eventTime: '', city: account?.city || '', venue: '', guestCount: '', budget: '', notes: '', needs: [] });

export function EventCreate() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const catalog = useCatalog();
  const { account } = useAuthStore();
  const type = sp.get('type');
  const create = useMutation({
    mutationFn: api.events.create,
    onSuccess: (e) => { qc.invalidateQueries({ queryKey: ['events'] }); qc.setQueryData(['event', e.id], e); navigate(`/events/${e.id}`, { replace: true }); },
  });
  if (catalog.isLoading) return <Spinner />;
  const preset = catalog.eventTypes.find((t) => t.code === type);
  const initial = { ...blank(account, preset?.code), title: preset && preset.code !== 'OTHER' ? preset.label : '', needs: preset ? [...preset.suggested] : [] };
  return (
    <div className="page max-w-2xl pb-14">
      <PageHeader title="Plan an event" back={<Link to="/events" className="btn-icon -ml-2" aria-label="My events"><ArrowLeft className="w-5 h-5" /></Link>} />
      <EventForm key={preset?.code || 'none'} initial={initial} showNeeds onSubmit={(d) => create.mutate(d)} submitting={create.isPending}
        error={create.error?.message} submitLabel="Create event" />
    </div>
  );
}

// ================================================================== detail

export function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const catalog = useCatalog();
  const { data: e, isLoading, error } = useQuery({ queryKey: ['event', id], queryFn: () => api.events.get(id) });
  const [editing, setEditing] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [allocating, setAllocating] = useState(null);

  const act = useMutation({
    mutationFn: (fn) => fn(),
    onSuccess: (data) => {
      if (data?.id) qc.setQueryData(['event', id], data);
      qc.invalidateQueries({ queryKey: ['events'] });
      setDialog(null); setEditing(false); setAllocating(null);
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <div className="page py-10"><EmptyState title="Event not found" action={<Link to="/events" className="btn btn-outline">My events</Link>}>{error.message}</EmptyState></div>;

  const st = EVENT_STATUS[e.status];
  const planning = e.status === 'PLANNING';
  const s = e.budgetSummary;
  const missing = catalog.categories.filter((c) => !e.needs.some((n) => n.category === c.code));
  const findProviders = (category) => {
    setPlanningEvent(e);
    navigate(`/explore${toQuery({ category, city: e.city, date: e.eventDate >= isoDate() ? e.eventDate : undefined, guests: e.guests })}`);
  };
  const booked = e.needs.filter((n) => n.state === 'BOOKED').length;

  return (
    <div className="page max-w-3xl pb-16">
      <div className="flex items-center gap-2 pt-5">
        <Link to="/events" className="btn-icon -ml-2" aria-label="My events"><ArrowLeft className="w-5 h-5" /></Link>
        <p className="t-small text-muted">My events</p>
      </div>

      {/* ------------------------------------------------ header */}
      <section className="card p-5 mt-3">
        <div className="flex items-start gap-3">
          <OccasionIcon type={e.eventType} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h1 className="t-h2 break-words">{e.title}</h1><Badge tone={st.tone}>{st.label}</Badge></div>
            <p className="t-small text-muted mt-0.5">{catalog.eventTypeLabels[e.eventType]}{planning && ` · ${countdown(e.eventDate)}`}</p>
          </div>
          {planning && <button className="btn-icon" aria-label="Edit event" onClick={() => setEditing(true)}><Pencil className="w-4 h-4" /></button>}
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 t-small">
          <div><dt className="t-caption flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />Date</dt><dd className="mt-0.5">{dateLabel(e.eventDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</dd></div>
          <div><dt className="t-caption flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Time</dt><dd className="mt-0.5">{e.eventTime ? timeLabel(e.eventTime) : '—'}</dd></div>
          <div><dt className="t-caption flex items-center gap-1"><Users className="w-3.5 h-3.5" />Guests</dt><dd className="mt-0.5">{e.guests}</dd></div>
          <div className="min-w-0"><dt className="t-caption flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />Where</dt><dd className="mt-0.5 break-words">{[e.venue, e.city].filter(Boolean).join(', ')}</dd></div>
        </dl>
        {e.notes && <p className="t-small text-muted mt-3 whitespace-pre-line break-words">{e.notes}</p>}
      </section>

      {/* ------------------------------------------------ budget */}
      <section className="card p-5 mt-4">
        <h2 className="t-h3 flex items-center gap-2"><Wallet className="w-5 h-5 text-navy" />Budget</h2>
        <BudgetTracker s={s} />
      </section>

      {/* ------------------------------------------------ checklist */}
      <section className="mt-6">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div><h2 className="t-h3">Checklist</h2><p className="t-small text-muted">{booked} of {e.needs.length} services booked</p></div>
          {planning && missing.length > 0 && <Button variant="outline" size="sm" icon={Plus} onClick={() => setDialog('addNeed')}>Add service</Button>}
        </div>
        {e.needs.length === 0 && <div className="panel p-4 t-small text-muted">No services on the checklist yet.</div>}
        <ul className="flex flex-col gap-3">
          {e.needs.map((n) => {
            const look = lookFor(n.category);
            const ns = NEED_STATE[n.state];
            return (
              <li key={n.id} className="panel p-4">
                <div className="flex items-start gap-3">
                  <span className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: look.bg, color: look.fg }}><look.icon className="w-5 h-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {n.state === 'BOOKED' ? <CheckCircle2 className="w-4 h-4 text-success" aria-hidden /> : <Circle className="w-4 h-4 text-line" aria-hidden />}
                      <span className="t-h4">{catalog.categoryLabel(n.category)}</span>
                      <Badge tone={ns.tone}>{ns.label}</Badge>
                    </div>
                    <button className="t-caption text-navy hover:underline mt-1" disabled={!planning} onClick={() => setAllocating(n)}>
                      {n.budgetAllocation != null ? `Budget ${money(n.budgetAllocation)}` : planning ? 'Set a budget for this' : ''}
                    </button>
                  </div>
                  {planning && n.bookings.length === 0 && (
                    <button className="btn-icon text-muted" aria-label={`Remove ${catalog.categoryLabel(n.category)}`}
                      onClick={() => act.mutate(() => api.events.removeNeed(id, n.id))}><X className="w-4 h-4" /></button>
                  )}
                </div>
                {n.bookings.length > 0 && <BookingRows rows={n.bookings} />}
                {planning && n.state !== 'BOOKED' && (
                  <Button size="sm" variant={n.state === 'NOT_STARTED' ? 'primary' : 'outline'} icon={Search} className="mt-3" onClick={() => findProviders(n.category)}>
                    {n.state === 'NOT_STARTED' ? 'Find providers' : 'Compare more providers'}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {e.otherBookings.length > 0 && (
          <div className="panel p-4 mt-3">
            <h3 className="t-h4">Other bookings for this event</h3>
            <BookingRows rows={e.otherBookings} />
          </div>
        )}
        {planning && <Button variant="ghost" size="sm" className="mt-3" onClick={() => setDialog('attach')}>Add an existing booking to this event</Button>}
      </section>

      {/* ------------------------------------------------ timeline */}
      <Timeline e={e} catalog={catalog} />

      {/* ------------------------------------------------ status actions */}
      <section className="mt-8 flex flex-wrap gap-2">
        {planning && <Button variant="outline" onClick={() => act.mutate(() => api.events.setStatus(id, 'COMPLETED'))}>Mark event completed</Button>}
        {planning && <Button variant="danger" onClick={() => setDialog('cancel')}>Cancel event</Button>}
        {!planning && <Button variant="outline" onClick={() => act.mutate(() => api.events.setStatus(id, 'PLANNING'))}>Reopen planning</Button>}
        <Button variant="ghost" icon={Trash2} onClick={() => setDialog('delete')}>Delete</Button>
      </section>
      <Alert className="mt-3">{!dialog && !editing && !allocating ? act.error?.message : null}</Alert>

      {/* ------------------------------------------------ dialogs */}
      {editing && (
        <Drawer open onClose={() => setEditing(false)} title="Edit event">
          <EventForm initial={{ ...blank(), ...e, guestCount: String(e.guests), budget: e.budget ?? '', venue: e.venue || '', notes: e.notes || '', eventTime: e.eventTime || '', autoTitle: false }}
            onSubmit={(d) => act.mutate(() => api.events.update(id, d))} submitting={act.isPending} error={act.error?.message} submitLabel="Save changes" />
        </Drawer>
      )}
      <AddNeedModal open={dialog === 'addNeed'} options={missing} onClose={() => setDialog(null)} loading={act.isPending} error={act.error?.message}
        onAdd={(category) => act.mutate(() => api.events.addNeed(id, { category }))} />
      <AllocationModal need={allocating} catalog={catalog} onClose={() => setAllocating(null)} loading={act.isPending} error={act.error?.message}
        onSave={(amount) => act.mutate(() => api.events.updateNeed(id, allocating.id, { category: allocating.category, budgetAllocation: amount, notes: allocating.notes }))} />
      <AttachModal open={dialog === 'attach'} event={e} onClose={() => setDialog(null)} loading={act.isPending} error={act.error?.message}
        onAttach={(bookingId) => act.mutate(() => api.events.attachBooking(id, bookingId))} />
      <Modal open={dialog === 'cancel'} onClose={() => setDialog(null)} title="Cancel this event?"
        footer={<><Button variant="outline" onClick={() => setDialog(null)}>Keep planning</Button><Button variant="navy" loading={act.isPending} onClick={() => act.mutate(() => api.events.setStatus(id, 'CANCELLED'))}>Cancel event</Button></>}>
        <p className="t-body text-muted">Your bookings are not cancelled automatically. Open each booking to cancel it with the provider.</p>
      </Modal>
      <Modal open={dialog === 'delete'} onClose={() => setDialog(null)} title="Delete this event?"
        footer={<><Button variant="outline" onClick={() => setDialog(null)}>Keep</Button>
          <Button variant="navy" loading={act.isPending} onClick={() => act.mutate(async () => { await api.events.remove(id); navigate('/events', { replace: true }); return null; })}>Delete</Button></>}>
        <p className="t-body text-muted">The checklist and budget are removed. Bookings stay in My bookings.</p>
        <Alert className="mt-3">{act.error?.message}</Alert>
      </Modal>
    </div>
  );
}

function BudgetTracker({ s }) {
  const committed = Number(s.committed);
  const pending = Number(s.pending);
  if (s.budget == null) {
    return (
      <div className="mt-3 t-small">
        <p className="text-muted">Add a total budget (Edit event) to see what is left.</p>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Figure label="Confirmed bookings" value={money(committed)} />
          <Figure label="Waiting for providers" value={money(pending)} />
        </div>
      </div>
    );
  }
  const budget = Number(s.budget) || 0;
  const remaining = Number(s.remaining);
  const pct = (v) => (budget > 0 ? Math.min(100, (v / budget) * 100) : 0);
  const over = remaining < 0;
  return (
    <div className="mt-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Figure label="Budget" value={money(budget)} />
        <Figure label="Confirmed" value={money(committed)} tone="navy" />
        <Figure label="Requested" value={money(pending)} tone="sky" />
        <Figure label={over ? 'Over budget' : 'Left to spend'} value={money(Math.abs(remaining))} tone={over ? 'danger' : 'success'} />
      </div>
      <div className="h-2.5 rounded-full bg-canvas overflow-hidden flex mt-4" role="img"
        aria-label={`${money(committed)} confirmed and ${money(pending)} requested of ${money(budget)}`}>
        <span className="h-full bg-navy" style={{ width: `${pct(committed)}%` }} />
        <span className="h-full bg-sky" style={{ width: `${pct(pending)}%` }} />
      </div>
      {over && <Alert tone="warning" className="mt-3">Confirmed and requested bookings are {money(-remaining)} over your budget.</Alert>}
      <p className="t-caption mt-3">
        {Number(s.awaitingPrice) > 0 && `${s.awaitingPrice} request(s) still waiting for a quotation are not included. `}
        {Number(s.allocated) > 0 && `You have set aside ${money(s.allocated)} across services. `}
        {Number(s.paidOnline) > 0 && `${money(s.paidOnline)} paid online.`}
      </p>
    </div>
  );
}

function Figure({ label, value, tone }) {
  const color = { navy: 'text-navy', sky: 'text-brand', danger: 'text-danger', success: 'text-success' }[tone] || 'text-ink';
  return (
    <div className="rounded-md bg-canvas p-3 min-w-0">
      <p className="t-caption truncate">{label}</p>
      <p className={cx('font-heading font-semibold text-[18px] mt-1 break-words', color)}>{value}</p>
    </div>
  );
}

function BookingRows({ rows }) {
  return (
    <ul className="mt-3 flex flex-col divide-y divide-line border-t border-line">
      {rows.map((b) => {
        const st = BOOKING_STATUS[b.status] || { label: b.status, tone: 'neutral' };
        const amount = b.finalAmount ?? b.estimatedTotal;
        return (
          <li key={b.id}>
            <Link to={`/bookings/${b.id}`} className="flex items-center gap-3 py-2.5 hover:bg-canvas -mx-1 px-1 rounded-sm">
              <Avatar src={b.providerAvatarUrl} name={b.businessName || b.providerName} size={32} />
              <span className="min-w-0 flex-1">
                <span className="t-small font-medium block truncate">{b.businessName || b.providerName}</span>
                <span className="t-caption block truncate">{b.serviceTitle} · {dateLabel(b.eventDate)}</span>
              </span>
              <span className="flex flex-col items-end gap-1 shrink-0">
                <Badge tone={st.tone}>{st.label}</Badge>
                <span className="t-caption">{amount != null ? money(amount) : 'Quote pending'}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Timeline({ e, catalog }) {
  const items = useMemo(() => {
    const all = [...e.needs.flatMap((n) => n.bookings), ...e.otherBookings]
      .filter((b) => !['PROVIDER_REJECTED', 'CUSTOMER_CANCELLED', 'PROVIDER_CANCELLED', 'EXPIRED'].includes(b.status))
      .map((b) => ({ key: b.id, date: b.eventDate, time: b.eventTime, title: `${catalog.categoryLabel(b.category)} — ${b.businessName || b.providerName}`, sub: BOOKING_STATUS[b.status]?.label }));
    all.push({ key: 'event', date: e.eventDate, time: e.eventTime, title: e.title, sub: 'Event', main: true });
    return all.sort((a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99')));
  }, [e, catalog]);
  if (items.length < 2) return null;
  return (
    <section className="mt-8">
      <h2 className="t-h3 mb-3">Timeline</h2>
      <ol className="border-l-2 border-line ml-1.5 flex flex-col gap-4">
        {items.map((i) => (
          <li key={i.key} className="pl-4 relative">
            <span className={cx('absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white', i.main ? 'bg-navy' : 'bg-sky')} />
            <p className={cx('t-small break-words', i.main ? 'font-semibold text-navy' : 'font-medium')}>{i.title}</p>
            <p className="t-caption">{dateLabel(i.date, { weekday: 'short', day: 'numeric', month: 'short' })}{i.time ? `, ${timeLabel(i.time)}` : ''} · {i.sub}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function AddNeedModal({ open, options, onClose, onAdd, loading, error }) {
  const [pick, setPick] = useState('');
  if (!open) return null;
  return (
    <Modal open title="Add a service" onClose={onClose}
      footer={<><Button variant="outline" onClick={onClose}>Close</Button><Button loading={loading} disabled={!pick} onClick={() => onAdd(pick)}>Add</Button></>}>
      <div className="flex flex-wrap gap-2">
        {options.map((c) => {
          const look = lookFor(c.code);
          return <button key={c.code} aria-pressed={pick === c.code} className={cx('chip', pick === c.code && 'chip-active')} onClick={() => setPick(c.code)}><look.icon className="w-4 h-4" />{c.label}</button>;
        })}
      </div>
      <Alert className="mt-3">{error}</Alert>
    </Modal>
  );
}

function AllocationModal({ need, catalog, onClose, onSave, loading, error }) {
  const [v, setV] = useState('');
  if (!need) return null;
  return (
    <Modal open title={`Budget for ${catalog.categoryLabel(need.category)}`} onClose={onClose}
      footer={<><Button variant="outline" onClick={() => onSave(null)} loading={loading}>Clear</Button><Button loading={loading} disabled={v === ''} onClick={() => onSave(Number(v))}>Save</Button></>}>
      <Field label="Amount you plan to spend (₹)" type="number" min="0" inputMode="numeric" autoFocus
        placeholder={need.budgetAllocation != null ? String(need.budgetAllocation) : ''} value={v} onChange={(e) => setV(e.target.value)} />
      <Alert className="mt-3">{error}</Alert>
    </Modal>
  );
}

function AttachModal({ open, event, onClose, onAttach, loading, error }) {
  const { data, isLoading } = useQuery({ queryKey: ['bookings', 'active', 0], queryFn: () => api.bookings.list('active', 0), enabled: open });
  if (!open) return null;
  const inEvent = new Set([...event.needs.flatMap((n) => n.bookings), ...event.otherBookings].map((b) => b.id));
  const options = (data?.items || []).filter((b) => !inEvent.has(b.id));
  return (
    <Modal open title="Add an existing booking" onClose={onClose}>
      {isLoading ? <Spinner /> : options.length === 0 ? <p className="t-body text-muted">You have no other active bookings.</p> : (
        <ul className="flex flex-col divide-y divide-line">
          {options.map((b) => (
            <li key={b.id} className="py-2.5 flex items-center gap-3">
              <span className="min-w-0 flex-1"><span className="t-small font-medium block truncate">{b.providerName} · {b.serviceTitle}</span>
                <span className="t-caption">{dateLabel(b.eventDate)} · {BOOKING_STATUS[b.status]?.label}</span></span>
              <Button size="sm" variant="outline" loading={loading} onClick={() => onAttach(b.id)}>Add</Button>
            </li>
          ))}
        </ul>
      )}
      <Alert className="mt-3">{error}</Alert>
    </Modal>
  );
}
