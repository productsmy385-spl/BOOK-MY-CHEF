import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarHeart, ChefHat, Crosshair, MapPin, MessageSquareQuote, Search, ShieldCheck } from 'lucide-react';
import { api, toQuery } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { useFavourites } from '../../hooks/useFavourites';
import { useAuthStore } from '../../stores/useAuthStore';
import ProviderCard from '../../components/marketplace/ProviderCard';
import BannerCarousel from '../../components/marketing/BannerCarousel';
import PromoCard from '../../components/marketing/PromoCard';
import { lookFor, occasionLook } from '../../components/marketing/visuals';
import { dateLabel } from '../../lib/format';
import { Button, EmptyState } from '../../components/ui';

export default function Home() {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const { account, status } = useAuthStore();
  const [q, setQ] = useState('');
  const city = account?.city;
  const isCustomer = status === 'ready' && account?.userType === 'CUSTOMER';

  const submit = (e) => {
    e.preventDefault();
    navigate(`/explore${toQuery({ q: q.trim(), city })}`);
  };

  return (
    <div className="pb-12">
      <section className="page pt-4 sm:pt-6">
        {city && (
          <Link to="/profile" className="inline-flex items-center gap-1.5 t-small text-navy font-medium mb-2">
            <MapPin className="w-4 h-4" aria-hidden /> {city}
          </Link>
        )}
        <form onSubmit={submit} className="flex gap-2 mb-4" role="search">
          <label className="relative flex-1 min-w-0">
            <span className="sr-only">Search</span>
            <Search className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search “Andhra home chef” or “wedding catering”"
              className="field-input pl-10 h-12" />
          </label>
          <button className="btn btn-primary h-12 px-5" type="submit">Search</button>
        </form>
        <BannerCarousel placement="HOME" />
        <HeroFallback account={account} />
      </section>

      {isCustomer && <UpcomingEvents />}
      <CategoryTiles catalog={catalog} city={city} />
      <Occasions catalog={catalog} />

      <Rail title="Featured chefs" hint="Selected by Book My Chef" query={{ key: ['featured'], fn: () => api.public.featured(10) }} catalog={catalog} />
      <TopRated catalog={catalog} city={city} />
      <Nearby catalog={catalog} />
      <Promotions catalog={catalog} />

      <section className="page mt-10">
        <Link to="/events/new" className="relative overflow-hidden rounded-lg flex items-center gap-4 p-5 sm:p-6 text-white hover:shadow-raised transition-shadow"
          style={{ background: 'linear-gradient(120deg,#2196F3 0%,#1551A5 100%)' }}>
          <CalendarHeart className="absolute -right-4 -bottom-6 w-36 h-36 text-white/10" aria-hidden />
          <span className="relative min-w-0 flex-1">
            <span className="font-heading font-bold text-[20px] sm:text-[24px] leading-tight block">Plan your whole event in one place</span>
            <span className="text-[14px] opacity-90 block mt-1">Get a checklist of services for your occasion, book each one and track your budget.</span>
          </span>
          <span className="relative hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-white text-navy text-[14px] font-semibold shrink-0">Start planning <ArrowRight className="w-4 h-4" /></span>
          <ArrowRight className="relative w-5 h-5 sm:hidden shrink-0" aria-hidden />
        </Link>
      </section>

      {catalog.cuisines.length > 0 && (
        <section className="page mt-10">
          <SectionHead title="Popular cuisines" />
          <div className="flex flex-wrap gap-2">
            {catalog.cuisines.map((c) => (
              <Link key={c.code} to={`/explore${toQuery({ cuisine: c.code, city })}`} className="chip">{c.label}</Link>
            ))}
          </div>
        </section>
      )}

      <EmptyMarketplace />

      <section className="page mt-12">
        <SectionHead title="How Book My Chef works" />
        <ol className="grid sm:grid-cols-3 gap-3">
          {[
            { icon: Search, t: 'Compare', d: 'See real prices, menus, availability and reviews from completed bookings.' },
            { icon: MessageSquareQuote, t: 'Request', d: 'Send your date, guests and menu. The provider accepts or sends a quotation.' },
            { icon: ShieldCheck, t: 'Confirm', d: 'Contact details are shared only after the provider confirms your booking.' },
          ].map((s, i) => (
            <li key={s.t} className="panel p-4 flex gap-3">
              <span className="w-10 h-10 rounded-full bg-pale text-navy flex items-center justify-center shrink-0"><s.icon className="w-5 h-5" aria-hidden /></span>
              <span className="min-w-0"><span className="t-h4 block">{i + 1}. {s.t}</span><span className="t-small text-muted block mt-0.5">{s.d}</span></span>
            </li>
          ))}
        </ol>
      </section>

      <section className="page mt-8">
        <Link to="/auth/partner" className="card p-5 flex items-center gap-4 hover:shadow-raised transition-shadow">
          <span className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center shrink-0"><ChefHat className="w-6 h-6" aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className="t-h4 block">Are you a chef or event professional?</span>
            <span className="t-small text-muted block mt-0.5">List your services, menus and prices, and receive booking requests directly.</span>
          </span>
          <ArrowRight className="w-5 h-5 text-navy shrink-0" aria-hidden />
        </Link>
      </section>
    </div>
  );
}

/** Round, colour-coded category shortcuts. */
function CategoryTiles({ catalog, city }) {
  if (!catalog.categories.length) return null;
  return (
    <section className="page mt-8">
      <SectionHead title="What do you need?" action={<Link to="/explore" className="t-small font-medium text-navy hover:underline">Explore all</Link>} />
      <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 gap-x-2 gap-y-4">
        {catalog.categories.map((c) => {
          const look = lookFor(c.code);
          return (
            <Link key={c.code} to={`/explore${toQuery({ category: c.code, city })}`} className="group flex flex-col items-center text-center gap-2 min-w-0">
              <span className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                style={{ background: look.bg, color: look.fg }}>
                <look.icon className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden />
              </span>
              <span className="text-[12px] sm:text-[13px] font-medium leading-tight text-ink break-words">{c.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Occasion cards open the event planner with that occasion's suggested checklist. */
function Occasions({ catalog }) {
  const types = catalog.eventTypes.filter((t) => t.code !== 'OTHER');
  if (!types.length) return null;
  return (
    <section className="page mt-10">
      <SectionHead title="Plan by occasion" hint="We suggest the services each occasion usually needs" />
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 lg:grid-cols-8 sm:overflow-visible">
        {types.map((t) => {
          const look = occasionLook(t.code);
          return (
            <Link key={t.code} to={`/events/new?type=${t.code}`}
              className="w-[118px] shrink-0 sm:w-auto rounded-lg p-3 flex flex-col gap-3 min-h-[112px] hover:shadow-raised transition-shadow"
              style={{ background: look.bg, color: look.fg }}>
              <look.icon className="w-7 h-7" aria-hidden />
              <span className="font-heading font-semibold text-[14px] leading-snug mt-auto">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function UpcomingEvents() {
  const { data } = useQuery({ queryKey: ['events'], queryFn: api.events.list });
  const upcoming = (data || []).filter((e) => e.status === 'PLANNING').slice(0, 3);
  if (!upcoming.length) return null;
  return (
    <section className="page mt-8">
      <SectionHead title="Your events" action={<Link to="/events" className="t-small font-medium text-navy hover:underline">All events</Link>} />
      <div className="grid sm:grid-cols-3 gap-3">
        {upcoming.map((e) => {
          const look = occasionLook(e.eventType);
          return (
            <Link key={e.id} to={`/events/${e.id}`} className="panel p-4 flex items-center gap-3 hover:border-sky">
              <span className="w-11 h-11 rounded-md flex items-center justify-center shrink-0" style={{ background: look.bg, color: look.fg }}><look.icon className="w-5 h-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="t-h4 block truncate">{e.title}</span>
                <span className="t-caption block">{dateLabel(e.eventDate)} · {e.needsBooked}/{e.needsTotal} booked</span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/** Text hero shown only while no campaign is live, so the page never starts empty. */
function HeroFallback({ account }) {
  const { data, isLoading } = useQuery({ queryKey: ['banners', 'HOME', undefined], queryFn: () => api.public.banners('HOME'), staleTime: 60_000 });
  if (isLoading || data?.length) return null;
  return (
    <div className="rounded-lg bg-gradient-to-br from-pale to-white border border-line px-5 py-8 sm:px-10 sm:py-12">
      <h1 className="t-h1 max-w-xl">
        {account?.fullName ? `Hi ${account.fullName.split(' ')[0]}, what are you planning?` : 'Great food and great events, booked in minutes'}
      </h1>
      <p className="t-body-lg text-muted mt-3 max-w-xl">Home chefs, caterers, planners, decorators and photographers — compare prices and book directly.</p>
    </div>
  );
}

function CardRow({ items, catalog }) {
  const favs = useFavourites();
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
      {items.map((p) => (
        <div key={p.id} className="w-[280px] shrink-0 sm:w-auto">
          <ProviderCard p={p} catalog={catalog} favourite={favs.ids.has(p.id)} onToggleFavourite={favs.enabled ? favs.toggle : undefined} />
        </div>
      ))}
    </div>
  );
}

function SectionHead({ title, hint, action }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h2 className="t-h3">{title}</h2>
        {hint && <p className="t-caption mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** A horizontal row of real providers. Renders nothing when there are none. */
function Rail({ title, hint, query, catalog, seeAll }) {
  const { data } = useQuery({ queryKey: query.key, queryFn: query.fn });
  if (!data?.length) return null;
  return (
    <section className="page mt-10">
      <SectionHead title={title} hint={hint} action={seeAll && <Link to={seeAll} className="t-small font-medium text-navy hover:underline">See all</Link>} />
      <CardRow items={data} catalog={catalog} />
    </section>
  );
}

function TopRated({ catalog, city }) {
  const { data } = useQuery({ queryKey: ['topRated', city], queryFn: () => api.public.topRated({ city, limit: 6 }) });
  const { data: any } = useQuery({ queryKey: ['search', { size: 1 }], queryFn: () => api.search({ size: 1 }) });
  if (!data || !any?.total) return null;
  return (
    <section className="page mt-10">
      <SectionHead title={city ? `Top-rated chefs in ${city}` : 'Top-rated chefs'}
        hint={`Ranked by genuine reviews from completed bookings (at least ${data.minReviews})`}
        action={data.items.length > 0 && <Link to={`/explore${toQuery({ sort: 'rating', category: 'HOME_CHEF,PRO_CHEF,PERSONAL_CHEF', city })}`} className="t-small font-medium text-navy hover:underline">See all</Link>} />
      {data.items.length ? <CardRow items={data.items} catalog={catalog} /> : (
        <p className="panel p-4 t-small text-muted">Not enough reviews yet to rank chefs. Ratings appear here once customers review completed bookings.</p>
      )}
    </section>
  );
}

function Nearby({ catalog }) {
  const [loc, setLoc] = useState(null);
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const nearby = useQuery({
    queryKey: ['nearby', loc], enabled: !!loc,
    queryFn: () => api.public.nearby({ lat: loc.lat, lng: loc.lng, radiusKm: 15, limit: 6 }),
  });
  const navigate = useNavigate();

  const locate = () => {
    setError('');
    if (!navigator.geolocation) return setError('Location is not available on this device. Enter your city instead.');
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude.toFixed(4), lng: p.coords.longitude.toFixed(4) }),
      () => setError('Location permission was denied. Enter your city instead.'),
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  return (
    <section className="page mt-10">
      <SectionHead title="Chefs near you" hint={loc ? 'Within 15 km, inside each chef’s own service area' : 'Use your location to see chefs who serve your area'} />
      {!loc ? (
        <div className="panel p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Button variant="outline" icon={Crosshair} onClick={locate}>Use my location</Button>
          <span className="t-small text-muted">or</span>
          <form className="flex gap-2 flex-1 min-w-0" onSubmit={(e) => { e.preventDefault(); if (city.trim()) navigate(`/explore?city=${encodeURIComponent(city.trim())}&category=HOME_CHEF,PRO_CHEF,PERSONAL_CHEF`); }}>
            <label className="relative flex-1 min-w-0">
              <span className="sr-only">City</span>
              <MapPin className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input className="field-input pl-9" placeholder="Enter your city" value={city} onChange={(e) => setCity(e.target.value)} />
            </label>
            <Button type="submit" variant="outline">Go</Button>
          </form>
        </div>
      ) : nearby.isLoading ? (
        <div className="panel p-4 t-small text-muted">Finding chefs near you…</div>
      ) : nearby.data?.length ? <CardRow items={nearby.data} catalog={catalog} /> : (
        <p className="panel p-4 t-small text-muted">No chefs serve your location yet. <Link to="/explore" className="text-navy font-medium hover:underline">Browse all providers</Link></p>
      )}
      {error && <p className="t-caption !text-danger mt-2">{error}</p>}
    </section>
  );
}

function Promotions({ catalog }) {
  const { data } = useQuery({ queryKey: ['promotions'], queryFn: () => api.public.promotions({ limit: 12 }), staleTime: 60_000 });
  if (!data?.length) return null;
  return (
    <section className="page mt-10">
      <SectionHead title="Offers from our chefs" hint="Sponsored promotions from providers, reviewed by Book My Chef" />
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {data.map((p) => <PromoCard key={p.id} promo={p} placement="HOME_PROMOTIONS" catalog={catalog} />)}
      </div>
    </section>
  );
}

function EmptyMarketplace() {
  const { data, isLoading } = useQuery({ queryKey: ['search', { size: 1 }], queryFn: () => api.search({ size: 1 }) });
  if (isLoading || data?.total) return null;
  return (
    <section className="page mt-10">
      <div className="panel">
        <EmptyState icon={ChefHat} title="Providers are joining soon"
          action={<Link to="/auth/partner" className="btn btn-outline">Offer your services</Link>}>
          No one has published a profile in your area yet. If you are a chef or event professional, you can be the first.
        </EmptyState>
      </div>
    </section>
  );
}
