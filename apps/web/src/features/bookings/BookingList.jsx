import { useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CalendarX2, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { BOOKING_STATUS, dateLabel, money, timeLabel } from '../../lib/format';
import { Alert, Avatar, Badge, EmptyState, PageHeader, Pager, Spinner, Tabs } from '../../components/ui';

const TABS = {
  CUSTOMER: [{ value: 'active', label: 'Active' }, { value: 'past', label: 'Past' }],
  PROVIDER: [{ value: 'requests', label: 'Requests' }, { value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }],
};

export default function BookingList({ viewer }) {
  const [scope, setScope] = useState(TABS[viewer][0].value);
  const [page, setPage] = useState(0);
  const catalog = useCatalog();
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['bookings', scope, page], queryFn: () => api.bookings.list(scope, page), placeholderData: keepPreviousData,
  });
  const base = viewer === 'PROVIDER' ? '/provider/bookings' : '/bookings';

  return (
    <div className="page max-w-3xl pb-10">
      <PageHeader title={viewer === 'PROVIDER' ? 'Bookings & requests' : 'My bookings'} />
      <Tabs value={scope} onChange={(v) => { setScope(v); setPage(0); }} options={TABS[viewer]} />
      <div className="mt-4" aria-busy={isFetching}>
        {isLoading ? <Spinner /> : error ? <Alert>{error.message}</Alert> : data.items.length === 0 ? (
          <EmptyState icon={CalendarX2}
            title={{ active: 'No active bookings', past: 'No past bookings', requests: 'No new requests', upcoming: 'No upcoming bookings' }[scope]}
            action={viewer === 'CUSTOMER' && scope === 'active' ? <Link to="/explore" className="btn btn-primary">Find a provider</Link> : null}>
            {viewer === 'CUSTOMER' && scope === 'active' ? 'When you request a booking, it will appear here with its status.' : null}
            {viewer === 'PROVIDER' && scope === 'requests' ? 'New booking requests from customers appear here.' : null}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.items.map((b) => {
              const st = BOOKING_STATUS[b.status] || { label: b.status, tone: 'neutral' };
              const amount = b.finalAmount ?? b.estimatedTotal;
              const name = viewer === 'PROVIDER' ? b.customerName : b.providerName;
              return (
                <li key={b.id}>
                  <Link to={`${base}/${b.id}`} className="panel p-4 flex items-center gap-3 hover:border-sky transition-colors">
                    <Avatar src={viewer === 'CUSTOMER' ? b.providerAvatarUrl : null} name={name} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="t-h4 truncate">{b.serviceTitle}</p>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </div>
                      <p className="t-small text-muted truncate">{name} · {catalog.categoryLabel(b.category)}</p>
                      <p className="t-caption mt-1">
                        {dateLabel(b.eventDate, { weekday: 'short', day: 'numeric', month: 'short' })}{b.eventTime && `, ${timeLabel(b.eventTime)}`} · {b.guests} guests · {b.city}
                        {amount != null && <> · <span className="text-ink font-medium">{money(amount)}</span></>}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted shrink-0" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        {data && <Pager page={page} size={data.size} total={data.total} onChange={setPage} />}
      </div>
    </div>
  );
}
