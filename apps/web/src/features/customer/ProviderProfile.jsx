import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, Clock, Heart, MapPin, Star, Users } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { useFavourites } from '../../hooks/useFavourites';
import { dateLabel, priceLabel, relativeTime, timeLabel, WEEKDAYS } from '../../lib/format';
import { Alert, Avatar, Badge, Button, EmptyState, Spinner, cx } from '../../components/ui';

export default function ProviderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const catalog = useCatalog();
  const favs = useFavourites();
  const { data: p, isLoading, error } = useQuery({ queryKey: ['provider', id], queryFn: () => api.providers.get(id) });
  const reviews = useQuery({ queryKey: ['reviews', id], queryFn: () => api.providers.reviews(id), enabled: !!p });

  if (isLoading) return <Spinner />;
  if (error) {
    return (
      <div className="page py-10">
        <EmptyState title={error.status === 404 ? 'This profile is not available' : 'Could not load this profile'}
          action={<Link to="/explore" className="btn btn-outline">Back to Explore</Link>}>
          {error.status === 404 ? 'The provider may have paused their listing.' : error.message}
        </EmptyState>
      </div>
    );
  }

  const location = [p.locality, p.city].filter(Boolean).join(', ');
  const book = (serviceId) => navigate(`/book/${p.id}${serviceId ? `?service=${serviceId}` : ''}`);
  const isFav = favs.ids.has(p.id);

  return (
    <div className="pb-28 md:pb-12">
      <div className="h-40 sm:h-56 bg-pale relative">
        {p.coverImageUrl && <img src={p.coverImageUrl} alt="" className="w-full h-full object-cover" />}
        <button onClick={() => navigate(-1)} className="absolute left-4 top-4 btn-icon bg-white/95 shadow-card" aria-label="Back"><ArrowLeft className="w-5 h-5" /></button>
      </div>

      <div className="page">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
          <Avatar src={p.avatarUrl} name={p.name} size={96} className="ring-4 ring-white" />
          <div className="min-w-0 flex-1 sm:pb-1">
            <h1 className="t-h2 break-words">{p.businessName || p.name}</h1>
            {p.businessName && <p className="t-small text-muted">{p.name}</p>}
          </div>
          {favs.enabled && (
            <Button variant="outline" icon={Heart} onClick={() => favs.toggle(p.id)} aria-pressed={isFav}
              className={cx(isFav && '[&_svg]:fill-danger [&_svg]:text-danger')}>{isFav ? 'Saved' : 'Save'}</Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 t-small">
          {p.verificationStatus === 'VERIFIED'
            ? <span className="flex items-center gap-1 text-success font-medium"><BadgeCheck className="w-4 h-4" /> Verified by Book My Chef</span>
            : <span className="text-muted">Not yet verified</span>}
          {p.averageRating != null
            ? <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" /> <strong>{Number(p.averageRating).toFixed(1)}</strong> ({p.reviewCount} reviews)</span>
            : <span className="text-muted">No reviews yet</span>}
          {p.completedBookings > 0 && <span>{p.completedBookings} completed bookings</span>}
          {p.experienceYears > 0 && <span>{p.experienceYears} years experience</span>}
          {location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{location} · serves within {p.maxTravelDistanceKm} km</span>}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {p.categories.map((c) => <Badge key={c} tone="blue">{catalog.categoryLabel(c)}</Badge>)}
          {p.cuisines.map((c) => <Badge key={c.code}>{c.label}</Badge>)}
          {p.customCuisines && <Badge>{p.customCuisines}</Badge>}
          {p.hasFoodLicense && <Badge tone="green">FSSAI licensed</Badge>}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 mt-8">
          <div className="flex flex-col gap-8 min-w-0">
            {p.bio && (
              <section>
                <h2 className="t-h3 mb-2">About</h2>
                <p className="t-body text-muted whitespace-pre-line break-words">{p.bio}</p>
              </section>
            )}

            <section>
              <h2 className="t-h3 mb-3">Services</h2>
              {!p.acceptingBookings && <Alert tone="warning" className="mb-3">This provider is not taking new bookings right now.</Alert>}
              <div className="flex flex-col gap-3">
                {p.services.map((s) => (
                  <div key={s.id} className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="t-caption">{catalog.categoryLabel(s.category)} · {catalog.modeLabels[s.deliveryMode]}</p>
                      <h3 className="t-h4 mt-0.5 break-words">{s.title}</h3>
                      {s.description && <p className="t-small text-muted mt-1 line-clamp-2">{s.description}</p>}
                      {(s.minGuests || s.maxGuests) && (
                        <p className="t-caption mt-1.5 flex items-center gap-1"><Users className="w-3.5 h-3.5" />
                          {s.minGuests && s.maxGuests ? `${s.minGuests}–${s.maxGuests} guests` : s.minGuests ? `From ${s.minGuests} guests` : `Up to ${s.maxGuests} guests`}
                        </p>
                      )}
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <p className="font-heading font-semibold">{priceLabel(s.price, s.pricingModel, catalog.pricingLabels)}</p>
                      <Button size="sm" onClick={() => book(s.id)} disabled={!p.acceptingBookings}>
                        {s.pricingModel === 'CUSTOM_QUOTE' ? 'Request quote' : 'Request booking'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {p.portfolio.length > 0 && (
              <section>
                <h2 className="t-h3 mb-3">Portfolio</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {p.portfolio.map((m) => m.mediaType === 'VIDEO' ? (
                    <video key={m.id} src={m.url} controls preload="metadata" className="w-full aspect-square object-cover rounded-md bg-canvas" />
                  ) : (
                    <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="block">
                      <img src={m.url} alt={m.title || ''} loading="lazy" className="w-full aspect-square object-cover rounded-md bg-canvas" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="t-h3 mb-3">Reviews</h2>
              {reviews.data?.items?.length ? (
                <ul className="flex flex-col divide-y divide-line">
                  {reviews.data.items.map((r) => (
                    <li key={r.id} className="py-4">
                      <div className="flex items-center gap-2 t-small">
                        <span className="flex items-center gap-0.5 font-semibold"><Star className="w-4 h-4 fill-[#F5A623] text-[#F5A623]" />{Number(r.rating).toFixed(1)}</span>
                        <span className="font-medium">{r.customerFirstName}</span>
                        <span className="text-muted">· {relativeTime(r.createdAt)}</span>
                      </div>
                      {r.serviceTitle && <p className="t-caption mt-0.5">{r.serviceTitle}</p>}
                      {r.text && <p className="t-body mt-2 break-words">{r.text}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="t-small text-muted">No reviews yet. Reviews come only from customers with completed bookings.</p>
              )}
            </section>
          </div>

          <aside className="flex flex-col gap-4">
            <div className="panel p-4">
              <h2 className="t-h4 mb-3 flex items-center gap-2"><Clock className="w-4 h-4" /> Availability</h2>
              {p.weeklyAvailability.length ? (
                <ul className="flex flex-col gap-1.5 t-small">
                  {p.weeklyAvailability.map((w) => (
                    <li key={w.dayOfWeek} className="flex justify-between gap-3">
                      <span>{WEEKDAYS[w.dayOfWeek - 1]}</span>
                      <span className={w.active ? '' : 'text-muted'}>{w.active ? `${timeLabel(w.startTime)} – ${timeLabel(w.endTime)}` : 'Unavailable'}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="t-small text-muted">Available any day, subject to confirmation.</p>}
              {p.bookingRules.advanceNoticeHours > 0 && <p className="t-caption mt-3">Needs {p.bookingRules.advanceNoticeHours} hours' notice.</p>}
              {p.blockedDates.length > 0 && (
                <p className="t-caption mt-2">Not available on {p.blockedDates.slice(0, 4).map((b) => dateLabel(b.date, { day: 'numeric', month: 'short' })).join(', ')}{p.blockedDates.length > 4 ? '…' : ''}.</p>
              )}
            </div>
            <Button size="lg" className="hidden md:flex w-full" onClick={() => book()} disabled={!p.acceptingBookings || !p.services.length}>Request a booking</Button>
          </aside>
        </div>
      </div>

      <div className="md:hidden fixed bottom-16 inset-x-0 z-20 bg-white border-t border-line px-4 py-3">
        <Button size="lg" className="w-full" onClick={() => book()} disabled={!p.acceptingBookings || !p.services.length}>Request a booking</Button>
      </div>
    </div>
  );
}
