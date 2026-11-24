import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Camera, ChefHat, Crosshair, MapPin, PartyPopper, Search, Sparkles, Users, UtensilsCrossed } from 'lucide-react';
import { api, toQuery } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { useFavourites } from '../../hooks/useFavourites';
import { useAuthStore } from '../../stores/useAuthStore';
import ProviderCard from '../../components/marketplace/ProviderCard';
import BannerCarousel from '../../components/marketing/BannerCarousel';
import PromoCard from '../../components/marketing/PromoCard';
import { Button, EmptyState } from '../../components/ui';

const GROUP_ICONS = { CULINARY: UtensilsCrossed, EVENTS: PartyPopper, MEDIA: Camera, STAFF: Users };

export default function Home() {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const { account } = useAuthStore();
  const [q, setQ] = useState('');
  const city = account?.city;

  const submit = (e) => {
    e.preventDefault();
    navigate(`/explore${toQuery({ q: q.trim(), city })}`);
  };

  return (
    <div className="pb-12">
      <section className="page pt-4 sm:pt-6">
        <form onSubmit={submit} className="flex gap-2 mb-4">
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

      <Rail title="Featured chefs" hint="Selected by Book My Chef" query={{ key: ['featured'], fn: () => api.public.featured(10) }} catalog={catalog} />
      <TopRated catalog={catalog} city={city} />
      <Nearby catalog={catalog} />
      <Promotions catalog={catalog} />

      <section className="page mt-10">
        <h2 className="t-h3 mb-4">Explore services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {catalog.categories.map((c) => {
            const Icon = GROUP_ICONS[c.group] || Sparkles;
            return (
              <Link key={c.code} to={`/explore?category=${c.code}`} className="panel p-4 flex items-center gap-3 hover:border-sky hover:bg-pale transition-colors min-w-0">
                <span className="w-10 h-10 rounded-md bg-pale text-navy flex items-center justify-center shrink-0"><Icon className="w-5 h-5" aria-hidden /></span>
                <span className="t-h4 leading-snug min-w-0 break-words">{c.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="page mt-8">
        <Link to="/explore?category=HOME_CHEF&mode=CHEF_VISITS_HOME,COOK_AND_DELIVER"
          className="card p-5 sm:p-6 flex items-center gap-4 hover:shadow-raised transition-shadow">
          <span className="w-12 h-12 rounded-full bg-navy text-white flex items-center justify-center shrink-0"><ChefHat className="w-6 h-6" aria-hidden /></span>
          <span className="min-w-0 flex-1">
            <span className="t-h3 block">Family gathering coming up?</span>
            <span className="t-small text-muted block mt-0.5">Find a home chef to cook traditional food at your home, or prepare and deliver it.</span>
          </span>
          <ArrowRight className="w-5 h-5 text-navy shrink-0" aria-hidden />
        </Link>
      </section>
      <EmptyMarketplace />
    </div>
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
