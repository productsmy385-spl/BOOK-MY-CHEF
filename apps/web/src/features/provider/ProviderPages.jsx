import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { dateLabel, isoDate } from '../../lib/format';
import { Alert, Button, Field, Modal, PageHeader, Spinner, cx } from '../../components/ui';
import { useProviderMe, useProviderMutation } from './useProviderMe';
import { AvailabilitySection, CategoriesSection, CuisinesSection, DocumentsSection, PortfolioSection, ProfileSection, PublishSection, ServicesSection } from './sections';

function useMe() {
  const q = useProviderMe();
  const loading = q.isLoading ? <Spinner /> : q.error ? <div className="page py-8"><Alert>{q.error.message}</Alert></div> : null;
  return { me: q.data, loading };
}

function Card({ title, hint, children, id }) {
  return (
    <section id={id} className="card p-5 sm:p-6">
      <h2 className="t-h3">{title}</h2>
      {hint && <p className="t-small text-muted mt-1">{hint}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ProviderServicesPage() {
  const { me, loading } = useMe();
  const catalog = useCatalog();
  if (loading) return loading;
  const culinary = me.categories.some((c) => catalog.category(c)?.culinary);
  return (
    <div className="page max-w-3xl pb-10 flex flex-col gap-5">
      <PageHeader title="Services & pricing" subtitle="Changes appear in the marketplace as soon as you save." />
      <Card title="Your services" hint="Each service has its own price and guest limits."><ServicesSection me={me} /></Card>
      <Card title="Service categories" hint="What kinds of work you take on."><CategoriesSection key={me.categories.join()} me={me} /></Card>
      {culinary && <Card title="Cuisines"><CuisinesSection me={me} /></Card>}
      {culinary && (
        <Card title="Food menu" hint="Dishes and set menus customers can choose when they book you, priced per person.">
          <Link to="/provider/menu" className="btn btn-outline">Manage food menu</Link>
        </Card>
      )}
    </div>
  );
}

export function ProviderProfilePage() {
  const { me, loading } = useMe();
  if (loading) return loading;
  return (
    <div className="page max-w-3xl pb-10 flex flex-col gap-5">
      <PageHeader title="Business profile" action={<Link to={`/p/${me.id}`} className="btn btn-ghost btn-sm">Preview</Link>} />
      <Card title="Visibility"><PublishSection me={me} /></Card>
      <Card title="Profile & location"><ProfileSection me={me} /></Card>
      <Card title="Portfolio"><PortfolioSection me={me} /></Card>
      <Card title="Verification" id="verification"><DocumentsSection me={me} /></Card>
    </div>
  );
}

/** Month view: tap a free day to block it, tap a blocked day to reopen it. */
export function ProviderCalendarPage() {
  const { me, loading } = useMe();
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [picked, setPicked] = useState(null);
  const [reason, setReason] = useState('');
  const upcoming = useQuery({ queryKey: ['bookings', 'upcoming', 'cal'], queryFn: () => api.bookings.list('upcoming', 0) });
  const block = useProviderMutation((d) => api.me.blockDate(d));
  const unblock = useProviderMutation((date) => api.me.unblockDate(date));

  const cells = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() + 6) % 7; // Monday first
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))];
  }, [month]);

  if (loading) return loading;
  const blocked = Object.fromEntries(me.blockedDates.map((b) => [b.date, b.reason]));
  const booked = {};
  (upcoming.data?.items || []).forEach((b) => { booked[b.eventDate] = (booked[b.eventDate] || 0) + 1; });
  const today = isoDate();
  const pickedIso = picked && isoDate(picked);

  return (
    <div className="page max-w-3xl pb-10 flex flex-col gap-5">
      <PageHeader title="Calendar & availability" />
      <section className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <button className="btn-icon" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="t-h3">{month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
          <button className="btn-icon" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="t-caption py-1">{d}</span>)}
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const iso = isoDate(d);
            const past = iso < today;
            return (
              <button key={i} disabled={past} onClick={() => { setPicked(d); setReason(''); }}
                aria-label={`${dateLabel(iso)}${blocked[iso] !== undefined ? ', blocked' : booked[iso] ? `, ${booked[iso]} booking` : ''}`}
                className={cx('aspect-square rounded-md flex flex-col items-center justify-center t-small border transition-colors',
                  past ? 'text-line border-transparent' : 'hover:border-sky border-transparent',
                  blocked[iso] !== undefined && 'bg-[#FDF2F2] text-danger border-[#F3C4C4]',
                  booked[iso] && 'bg-pale text-navy font-semibold border-sky',
                  iso === today && 'ring-2 ring-brand')}>
                {d.getDate()}
                {booked[iso] ? <span className="w-1.5 h-1.5 rounded-full bg-brand mt-0.5" /> : null}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-4 mt-4 t-caption">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pale border border-sky" />Booked</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#FDF2F2] border border-[#F3C4C4]" />Blocked</span>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="t-h3 mb-1">Weekly hours & booking rules</h2>
        <p className="t-small text-muted mb-5">Customers cannot request times outside these hours.</p>
        <AvailabilitySection me={me} />
      </section>

      <Modal open={!!picked} onClose={() => setPicked(null)} title={picked ? dateLabel(pickedIso, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
        footer={picked && (blocked[pickedIso] !== undefined
          ? <Button loading={unblock.isPending} onClick={() => unblock.mutate(pickedIso, { onSuccess: () => setPicked(null) })}>Make available</Button>
          : <Button variant="navy" loading={block.isPending} onClick={() => block.mutate({ date: pickedIso, reason: reason || undefined }, { onSuccess: () => setPicked(null) })}>Block this day</Button>)}>
        {picked && (
          <div className="flex flex-col gap-3">
            {booked[pickedIso] ? <Alert tone="info">You have {booked[pickedIso]} confirmed booking(s) on this day.</Alert> : null}
            {blocked[pickedIso] !== undefined
              ? <p className="t-body">This day is blocked{blocked[pickedIso] ? `: ${blocked[pickedIso]}` : ''}. Customers cannot book it.</p>
              : <Field label="Reason (only you see this)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} />}
            <Alert>{block.error?.message || unblock.error?.message}</Alert>
          </div>
        )}
      </Modal>
    </div>
  );
}
