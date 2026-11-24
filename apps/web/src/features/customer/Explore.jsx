import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { Crosshair, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { useFavourites } from '../../hooks/useFavourites';
import { addDays, dateLabel, isoDate, money } from '../../lib/format';
import ProviderCard from '../../components/marketplace/ProviderCard';
import BannerCarousel from '../../components/marketing/BannerCarousel';
import { Alert, Button, Checkbox, Drawer, EmptyState, Field, cx } from '../../components/ui';

const PAGE_SIZE = 12;
const LIST_KEYS = ['category', 'cuisine', 'mode'];
const SORTS = [
  ['recommended', 'Recommended'],
  ['rating', 'Top rated'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['experience', 'Most experienced'],
  ['distance', 'Nearest'],
];

/** Reads all filters from the URL so selections survive refresh and can be shared. */
function readFilters(sp) {
  const f = {};
  for (const [k, v] of sp.entries()) f[k] = LIST_KEYS.includes(k) ? v.split(',').filter(Boolean) : v;
  LIST_KEYS.forEach((k) => { f[k] = f[k] || []; });
  return f;
}

export default function Explore() {
  const [sp, setSp] = useSearchParams();
  const filters = useMemo(() => readFilters(sp), [sp]);
  const catalog = useCatalog();
  const favs = useFavourites();
  const [query, setQuery] = useState(filters.q || '');
  const [drawerOpen, setDrawerOpen] = useState(false);

  /** Writes filters back to the URL without navigating away (replace keeps history clean). */
  const update = (patch) => {
    const next = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && !v.length)) next.delete(k);
      else next.set(k, Array.isArray(v) ? v.join(',') : String(v));
    });
    setSp(next, { replace: true });
  };

  // Debounced free-text search
  useEffect(() => {
    if ((filters.q || '') === query.trim()) return undefined;
    const t = setTimeout(() => update({ q: query.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
  useEffect(() => setQuery(filters.q || ''), [filters.q]);

  const apiParams = {
    q: filters.q, category: filters.category, cuisine: filters.cuisine, mode: filters.mode,
    pricingModel: filters.pricingModel, minPrice: filters.minPrice, maxPrice: filters.maxPrice,
    city: filters.city, area: filters.area, lat: filters.lat, lng: filters.lng,
    radiusKm: filters.lat ? filters.radiusKm || 10 : undefined, date: filters.date, time: filters.time,
    guests: filters.guests, verified: filters.verified, minRating: filters.minRating,
    minExperience: filters.minExperience, minCompleted: filters.minCompleted, sort: filters.sort,
  };

  const results = useInfiniteQuery({
    queryKey: ['search', apiParams],
    queryFn: ({ pageParam }) => api.search({ ...apiParams, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (last) => ((last.page + 1) * last.size < last.total ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
  const items = results.data?.pages.flatMap((p) => p.items) || [];
  const total = results.data?.pages[0]?.total ?? 0;

  const activeChips = buildChips(filters, catalog);
  const singleCategory = filters.category.length === 1 ? filters.category[0] : null;

  return (
    <div className="page pb-10">
      {/* Search */}
      <div className="pt-4 sm:pt-6 flex gap-2">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Search</span>
          <Search className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
          <input value={query} onChange={(e) => setQuery(e.target.value)} type="search"
            placeholder="Search chefs, cuisines, caterers…" className="field-input pl-10 h-12" />
        </label>
        <Button variant="outline" className="h-12 relative" onClick={() => setDrawerOpen(true)} icon={SlidersHorizontal} aria-label="Filters">
          <span className="hidden sm:inline">Filters</span>
          {activeChips.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-brand text-white text-[11px] flex items-center justify-center">{activeChips.length}</span>
          )}
        </Button>
      </div>

      {singleCategory
        ? <BannerCarousel key={singleCategory} placement="CATEGORY" category={singleCategory} variant="compact" className="mt-4" />
        : <BannerCarousel placement="EXPLORE" variant="compact" className="mt-4" />}

      {/* Category chips: in-page filter, no navigation */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-4 -mx-4 px-4 sm:mx-0 sm:px-0" role="toolbar" aria-label="Service category">
        <button className={cx('chip', !filters.category.length && 'chip-active')} aria-pressed={!filters.category.length}
          onClick={() => update({ category: [], page: undefined })}>All</button>
        {catalog.categories.map((c) => {
          const on = filters.category.includes(c.code);
          return (
            <button key={c.code} className={cx('chip', on && 'chip-active')} aria-pressed={on}
              onClick={() => update({ category: singleCategory === c.code ? [] : [c.code] })}>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Active filters + result summary */}
      <div className="flex flex-wrap items-center gap-2 min-h-9">
        <p className="t-small text-muted mr-auto" aria-live="polite">
          {results.isLoading ? 'Searching…' : `${total} ${total === 1 ? 'provider' : 'providers'}`}
          {singleCategory && !results.isLoading && <> for <strong className="text-ink">{catalog.categoryLabel(singleCategory)}</strong></>}
        </p>
        <label className="flex items-center gap-2 t-small">
          <span className="text-muted">Sort</span>
          <select value={filters.sort || 'recommended'} onChange={(e) => update({ sort: e.target.value === 'recommended' ? '' : e.target.value })}
            className="field-input h-9 w-auto pr-8 text-[13px]">
            {SORTS.filter(([v]) => v !== 'distance' || filters.lat).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {activeChips.map((c) => (
            <button key={c.key} onClick={() => update(c.remove)} className="chip chip-active h-8" aria-label={`Remove filter ${c.label}`}>
              {c.label} <X className="w-3.5 h-3.5" aria-hidden />
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setSp(new URLSearchParams(), { replace: true })}>Clear all</button>
        </div>
      )}

      {/* Results */}
      <section className="mt-5" aria-busy={results.isFetching}>
        {results.isError && <Alert>{results.error.message}</Alert>}
        {results.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-[320px] animate-pulse bg-canvas" />)}
          </div>
        ) : items.length === 0 && !results.isError ? (
          <EmptyState icon={SearchX} title="No providers match these filters"
            action={activeChips.length > 0 || filters.q ? <Button variant="outline" onClick={() => setSp(new URLSearchParams(), { replace: true })}>Clear filters</Button> : null}>
            {activeChips.length > 0 || filters.q
              ? 'Try removing a filter, widening your budget, or choosing another date.'
              : 'No providers have published their services yet. Please check back soon.'}
          </EmptyState>
        ) : (
          <div className={cx('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity', results.isFetching && !results.isFetchingNextPage && 'opacity-60')}>
            {items.map((p) => (
              <ProviderCard key={p.id} p={p} catalog={catalog}
                favourite={favs.ids.has(p.id)} onToggleFavourite={favs.enabled ? favs.toggle : undefined} />
            ))}
          </div>
        )}
        {results.hasNextPage && (
          <div className="flex justify-center mt-6">
            <Button variant="outline" loading={results.isFetchingNextPage} onClick={() => results.fetchNextPage()}>Show more</Button>
          </div>
        )}
      </section>

      <FilterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} filters={filters} catalog={catalog}
        onApply={(patch) => { update(patch); setDrawerOpen(false); }} />
    </div>
  );
}

function buildChips(f, catalog) {
  const chips = [];
  if (f.category.length > 1) f.category.forEach((c) => chips.push({ key: `c-${c}`, label: catalog.categoryLabel(c), remove: { category: f.category.filter((x) => x !== c) } }));
  f.cuisine.forEach((c) => chips.push({ key: `q-${c}`, label: catalog.cuisineLabels[c] || c, remove: { cuisine: f.cuisine.filter((x) => x !== c) } }));
  f.mode.forEach((m) => chips.push({ key: `m-${m}`, label: catalog.modeLabels[m] || m, remove: { mode: f.mode.filter((x) => x !== m) } }));
  if (f.minPrice || f.maxPrice) {
    const unit = f.pricingModel ? ` ${catalog.pricingLabels[f.pricingModel] || ''}` : '';
    chips.push({ key: 'price', label: `${f.minPrice ? money(f.minPrice) : '₹0'} – ${f.maxPrice ? money(f.maxPrice) : 'any'}${unit}`, remove: { minPrice: '', maxPrice: '', pricingModel: '' } });
  }
  if (f.pricingModel && !(f.minPrice || f.maxPrice)) chips.push({ key: 'pm', label: `Priced ${catalog.pricingLabels[f.pricingModel]}`, remove: { pricingModel: '' } });
  if (f.city) chips.push({ key: 'city', label: f.city, remove: { city: '' } });
  if (f.area) chips.push({ key: 'area', label: f.area, remove: { area: '' } });
  if (f.lat) chips.push({ key: 'near', label: `Within ${f.radiusKm || 10} km of you`, remove: { lat: '', lng: '', radiusKm: '', sort: f.sort === 'distance' ? '' : f.sort } });
  if (f.date) chips.push({ key: 'date', label: `Available ${dateLabel(f.date, { day: 'numeric', month: 'short' })}${f.time ? ` at ${f.time}` : ''}`, remove: { date: '', time: '' } });
  if (f.guests) chips.push({ key: 'guests', label: `${f.guests} guests`, remove: { guests: '' } });
  if (f.verified) chips.push({ key: 'verified', label: 'Verified only', remove: { verified: '' } });
  if (f.minRating) chips.push({ key: 'rating', label: `${f.minRating}★ and above`, remove: { minRating: '' } });
  if (f.minExperience) chips.push({ key: 'exp', label: `${f.minExperience}+ yrs experience`, remove: { minExperience: '' } });
  if (f.minCompleted) chips.push({ key: 'done', label: `${f.minCompleted}+ completed bookings`, remove: { minCompleted: '' } });
  return chips;
}

/** Draft filters edited in the drawer; applied to the URL in one step. */
function FilterDrawer({ open, onClose, filters, catalog, onApply }) {
  const [d, setD] = useState(filters);
  const [geoError, setGeoError] = useState('');
  useEffect(() => { if (open) { setD(filters); setGeoError(''); } }, [open, filters]);
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const toggle = (k, v) => setD((x) => ({ ...x, [k]: x[k].includes(v) ? x[k].filter((y) => y !== v) : [...x[k], v] }));

  const chosenCats = d.category.map(catalog.category).filter(Boolean);
  const pricingOptions = chosenCats.length
    ? catalog.pricingModels.filter((p) => p.code !== 'CUSTOM_QUOTE' && chosenCats.some((c) => c.pricingModels.includes(p.code)))
    : catalog.pricingModels.filter((p) => p.code !== 'CUSTOM_QUOTE');
  const modeOptions = chosenCats.length
    ? catalog.deliveryModes.filter((m) => chosenCats.some((c) => c.deliveryModes.includes(m.code)))
    : catalog.deliveryModes;
  const showCuisine = !chosenCats.length || chosenCats.some((c) => c.culinary);
  const today = isoDate();
  const tomorrow = isoDate(addDays(1));

  const locate = () => {
    setGeoError('');
    if (!navigator.geolocation) return setGeoError('Location is not available on this device.');
    navigator.geolocation.getCurrentPosition(
      (pos) => setD((x) => ({ ...x, lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5), radiusKm: x.radiusKm || '10' })),
      () => setGeoError('Location permission was denied. Enter a city instead.'),
      { timeout: 10000 },
    );
  };

  const apply = () => {
    if (d.minPrice && d.maxPrice && Number(d.minPrice) > Number(d.maxPrice)) return setGeoError('Minimum budget cannot be more than the maximum.');
    onApply({
      category: d.category, cuisine: showCuisine ? d.cuisine : [], mode: d.mode.filter((m) => modeOptions.some((o) => o.code === m)),
      pricingModel: pricingOptions.some((p) => p.code === d.pricingModel) ? d.pricingModel : '',
      minPrice: d.minPrice, maxPrice: d.maxPrice, city: d.city?.trim(), area: d.area?.trim(),
      lat: d.lat, lng: d.lng, radiusKm: d.lat ? d.radiusKm : '', date: d.date, time: d.date ? d.time : '',
      guests: d.guests, verified: d.verified ? 'true' : '', minRating: d.minRating, minExperience: d.minExperience, minCompleted: d.minCompleted,
    });
  };

  const reset = () => setD(readFilters(new URLSearchParams()));

  return (
    <Drawer open={open} onClose={onClose} title="Filters"
      footer={<div className="flex gap-2"><Button variant="outline" onClick={reset} className="flex-1">Reset</Button><Button onClick={apply} className="flex-[2]">Show results</Button></div>}>
      <div className="flex flex-col gap-7 pb-4">
        <Section title="Service">
          <div className="flex flex-wrap gap-2">
            {catalog.categories.map((c) => (
              <button key={c.code} aria-pressed={d.category.includes(c.code)} onClick={() => toggle('category', c.code)}
                className={cx('chip', d.category.includes(c.code) && 'chip-active')}>{c.label}</button>
            ))}
          </div>
        </Section>

        {modeOptions.length > 1 && (
          <Section title="How the service is delivered">
            <div className="flex flex-col">
              {modeOptions.map((m) => <Checkbox key={m.code} label={m.label} checked={d.mode.includes(m.code)} onChange={() => toggle('mode', m.code)} />)}
            </div>
          </Section>
        )}

        {showCuisine && (
          <Section title="Cuisine">
            <div className="flex flex-wrap gap-2">
              {catalog.cuisines.map((c) => (
                <button key={c.code} aria-pressed={d.cuisine.includes(c.code)} onClick={() => toggle('cuisine', c.code)}
                  className={cx('chip', d.cuisine.includes(c.code) && 'chip-active')}>{c.label}</button>
              ))}
            </div>
          </Section>
        )}

        <Section title="Budget">
          <Field as="select" label="Price basis" value={d.pricingModel || ''} onChange={(e) => set('pricingModel', e.target.value)}
            hint="Compare prices on the same basis, e.g. per person.">
            <option value="">Any pricing</option>
            {pricingOptions.map((p) => <option key={p.code} value={p.code}>{p.label[0].toUpperCase() + p.label.slice(1)}</option>)}
          </Field>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Min (₹)" type="number" inputMode="numeric" min="0" value={d.minPrice || ''} onChange={(e) => set('minPrice', e.target.value)} />
            <Field label="Max (₹)" type="number" inputMode="numeric" min="0" value={d.maxPrice || ''} onChange={(e) => set('maxPrice', e.target.value)} />
          </div>
        </Section>

        <Section title="Location">
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" value={d.city || ''} onChange={(e) => set('city', e.target.value)} />
            <Field label="Area" value={d.area || ''} onChange={(e) => set('area', e.target.value)} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" icon={Crosshair} onClick={locate}>{d.lat ? 'Location set' : 'Use my location'}</Button>
            {d.lat && (
              <>
                <Field as="select" value={d.radiusKm || '10'} onChange={(e) => set('radiusKm', e.target.value)} aria-label="Radius" className="w-28">
                  {[5, 10, 25, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
                </Field>
                <button className="btn btn-ghost btn-sm" onClick={() => setD((x) => ({ ...x, lat: '', lng: '', radiusKm: '' }))}>Clear</button>
              </>
            )}
          </div>
          {geoError && <Alert className="mt-3">{geoError}</Alert>}
        </Section>

        <Section title="Availability">
          <div className="flex flex-wrap gap-2">
            {[[today, 'Today'], [tomorrow, 'Tomorrow']].map(([v, l]) => (
              <button key={l} aria-pressed={d.date === v} onClick={() => set('date', d.date === v ? '' : v)} className={cx('chip', d.date === v && 'chip-active')}>{l}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Date" type="date" min={today} value={d.date || ''} onChange={(e) => set('date', e.target.value)} />
            <Field label="Time" type="time" value={d.time || ''} onChange={(e) => set('time', e.target.value)} disabled={!d.date} />
          </div>
          <Field className="mt-3" label="Number of guests" type="number" inputMode="numeric" min="1" value={d.guests || ''} onChange={(e) => set('guests', e.target.value)} />
        </Section>

        <Section title="Experience & trust">
          <Checkbox label="Verified professionals only" description="Identity and documents checked by Book My Chef" checked={!!d.verified} onChange={(v) => set('verified', v)} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <Field as="select" label="Rating" value={d.minRating || ''} onChange={(e) => set('minRating', e.target.value)}>
              <option value="">Any</option><option value="4.5">4.5★ +</option><option value="4">4★ +</option><option value="3.5">3.5★ +</option>
            </Field>
            <Field as="select" label="Experience" value={d.minExperience || ''} onChange={(e) => set('minExperience', e.target.value)}>
              <option value="">Any</option><option value="2">2+ yrs</option><option value="5">5+ yrs</option><option value="10">10+ yrs</option>
            </Field>
            <Field as="select" label="Completed bookings" value={d.minCompleted || ''} onChange={(e) => set('minCompleted', e.target.value)}>
              <option value="">Any</option><option value="1">1+</option><option value="10">10+</option><option value="50">50+</option>
            </Field>
          </div>
        </Section>
      </div>
    </Drawer>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="t-h4 mb-3">{title}</h3>
      {children}
    </section>
  );
}
