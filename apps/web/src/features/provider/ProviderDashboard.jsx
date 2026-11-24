import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Rocket } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { useAuthStore } from '../../stores/useAuthStore';
import { BOOKING_STATUS, dateLabel, money, timeLabel, VERIFICATION } from '../../lib/format';
import { Alert, Badge, PageHeader, Spinner, Stat } from '../../components/ui';

export default function ProviderDashboard() {
  const { account } = useAuthStore();
  const catalog = useCatalog();
  const { data: d, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: api.me.dashboard });

  if (isLoading) return <Spinner />;
  if (error) return <div className="page py-8"><Alert>{error.message}</Alert></div>;
  const v = VERIFICATION[d.verificationStatus];
  const live = d.onboardingStatus === 'PUBLISHED';

  return (
    <div className="page pb-10">
      <PageHeader title={`Hello, ${account.fullName?.split(' ')[0] || 'partner'}`}
        subtitle={live ? (d.acceptingBookings ? 'Your profile is live and accepting bookings.' : 'Your profile is live but paused for new bookings.') : 'Your profile is not visible to customers yet.'}
        action={<Badge tone={v.tone}>{v.label}</Badge>} />

      {!live && (
        <Link to="/provider/setup" className="card p-5 flex items-center gap-4 mb-6 border-sky bg-pale hover:shadow-raised transition-shadow">
          <Rocket className="w-6 h-6 text-navy shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="t-h4 block">Finish setting up to start receiving bookings</span>
            <span className="t-small text-muted block">Add your services and prices, then publish your profile.</span>
          </span>
          <ChevronRight className="w-5 h-5 text-navy shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/provider/bookings"><Stat label="New requests" value={d.newRequests} hint="Waiting for your reply" /></Link>
        <Stat label="Upcoming" value={d.upcoming} hint="Confirmed bookings" />
        <Stat label="Completed" value={d.completed} hint={d.cancelled ? `${d.cancelled} cancelled` : undefined} />
        <Stat label="Earnings this month" value={money(d.earningsThisMonth)} hint={`${money(d.earningsTotal)} all time, completed bookings`} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <Stat label="Awaiting customer" value={d.awaitingCustomer} hint="Quotes or payment pending" />
        <Stat label="Rating" value={d.averageRating != null ? `${Number(d.averageRating).toFixed(1)} ★` : '—'} hint={d.reviewCount ? `${d.reviewCount} reviews` : 'No reviews yet'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <section>
          <h2 className="t-h3 mb-3">Next bookings</h2>
          {d.nextBookings.length === 0 ? <p className="panel p-4 t-small text-muted">No upcoming confirmed bookings.</p> : (
            <ul className="panel divide-y divide-line">
              {d.nextBookings.map((b) => (
                <li key={b.id}>
                  <Link to={`/provider/bookings/${b.id}`} className="p-4 flex items-center gap-3 hover:bg-canvas">
                    <div className="w-12 text-center shrink-0">
                      <p className="t-caption uppercase">{dateLabel(b.eventDate, { month: 'short' })}</p>
                      <p className="t-h3">{dateLabel(b.eventDate, { day: 'numeric' })}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="t-h4 truncate">{b.serviceTitle}</p>
                      <p className="t-caption truncate">{b.customerName} · {b.guests} guests{b.eventTime && ` · ${timeLabel(b.eventTime)}`}</p>
                    </div>
                    <Badge tone={BOOKING_STATUS[b.status]?.tone}>{BOOKING_STATUS[b.status]?.label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="t-h3 mb-3">Service performance</h2>
          {d.servicePerformance.length === 0 ? <p className="panel p-4 t-small text-muted">Add services to see how they perform.</p> : (
            <table className="w-full panel t-small">
              <thead><tr className="text-left text-muted"><th className="p-3 font-medium">Service</th><th className="p-3 font-medium text-right">Requests</th><th className="p-3 font-medium text-right">Completed</th></tr></thead>
              <tbody className="divide-y divide-line">
                {d.servicePerformance.map((s) => (
                  <tr key={s.id}><td className="p-3"><p className="truncate max-w-[220px]">{s.title}</p><p className="t-caption">{catalog.categoryLabel(s.category)}</p></td>
                    <td className="p-3 text-right tabular-nums">{s.requests}</td><td className="p-3 text-right tabular-nums">{s.completed}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
