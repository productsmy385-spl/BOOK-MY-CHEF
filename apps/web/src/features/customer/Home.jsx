import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Camera, ChefHat, PartyPopper, Search, Sparkles, Users, UtensilsCrossed } from 'lucide-react';
import { api, toQuery } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { useFavourites } from '../../hooks/useFavourites';
import { useAuthStore } from '../../stores/useAuthStore';
import { isoDate } from '../../lib/format';
import ProviderCard from '../../components/marketplace/ProviderCard';
import { EmptyState } from '../../components/ui';

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
      <section className="bg-gradient-to-b from-pale to-white">
        <div className="page pt-8 pb-10 sm:pt-14 sm:pb-14">
          <h1 className="t-h1 max-w-xl">
            {account?.fullName ? `Hi ${account.fullName.split(' ')[0]}, what are you planning?` : 'Great food and great events, booked in minutes'}
          </h1>
          <p className="t-body-lg text-muted mt-3 max-w-xl">Home chefs, caterers, planners, decorators and photographers — compare prices and book directly.</p>
          <form onSubmit={submit} className="mt-6 flex gap-2 max-w-xl">
            <label className="relative flex-1 min-w-0">
              <span className="sr-only">Search</span>
              <Search className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
              <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Try “Andhra home chef” or “wedding catering”"
                className="field-input pl-10 h-12 shadow-card" />
            </label>
            <button className="btn btn-primary h-12 px-5" type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="page mt-8">
        <h2 className="t-h3 mb-4">Browse by service</h2>
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

      <Rail title={city ? `Popular in ${city}` : 'Top rated'} params={{ sort: 'rating', city }} catalog={catalog} seeAll={`/explore${toQuery({ sort: 'rating', city })}`} />
      <Rail title="Available today" params={{ date: isoDate() }} catalog={catalog} seeAll={`/explore?date=${isoDate()}`} />
      <EmptyMarketplace />
    </div>
  );
}

/** A horizontal row of real providers. Renders nothing when there are none. */
function Rail({ title, params, seeAll, catalog }) {
  const favs = useFavourites();
  const { data } = useQuery({ queryKey: ['search', { ...params, size: 6 }], queryFn: () => api.search({ ...params, size: 6 }) });
  if (!data?.items?.length) return null;
  return (
    <section className="page mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="t-h3">{title}</h2>
        <Link to={seeAll} className="t-small font-medium text-navy hover:underline">See all</Link>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
        {data.items.map((p) => (
          <div key={p.id} className="w-[280px] shrink-0 sm:w-auto">
            <ProviderCard p={p} catalog={catalog} favourite={favs.ids.has(p.id)} onToggleFavourite={favs.enabled ? favs.toggle : undefined} />
          </div>
        ))}
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
