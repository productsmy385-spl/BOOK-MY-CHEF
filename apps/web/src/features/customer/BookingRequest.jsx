import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Info } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePlanningEvent } from '../../hooks/usePlanningEvent';
import { isoDate, priceLabel } from '../../lib/format';
import { Alert, Avatar, Button, EmptyState, Field, Spinner, cx } from '../../components/ui';
import { MenuPicker, PriceBreakdown } from '../../components/menu/MenuBits';
import { EMPTY_PICK, missingChoices, toSelection } from '../../components/menu/menuSelection';

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const DIETARY = ['Vegetarian', 'Non-vegetarian', 'Both veg & non-veg', 'Jain', 'Vegan'];

export default function BookingRequest() {
  const { providerId } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const catalog = useCatalog();
  const { account } = useAuthStore();
  const provider = useQuery({ queryKey: ['provider', providerId], queryFn: () => api.providers.get(providerId) });
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: api.customer.addresses });
  const menu = useQuery({ queryKey: ['menu', providerId], queryFn: () => api.providers.menu(providerId) });
  const [pick, setPick] = useState(EMPTY_PICK);
  const planning = usePlanningEvent();
  const myEvents = useQuery({ queryKey: ['events'], queryFn: api.events.list });
  const openEvents = (myEvents.data || []).filter((e) => e.status === 'PLANNING');
  const [eventId, setEventId] = useState(sp.get('event') || planning?.id || '');

  const [serviceId, setServiceId] = useState(sp.get('service') || '');
  const [f, setF] = useState({ eventDate: '', eventTime: '19:00', guestCount: '', eventAddress: '', eventCity: account?.city || '',
    hours: '', days: '', cuisinePreference: '', budget: '', specialInstructions: '' });
  const [details, setDetails] = useState({});
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setD = (k) => (e) => setDetails((x) => ({ ...x, [k]: e.target.value }));

  const p = provider.data;
  const service = p?.services.find((s) => s.id === serviceId);
  const category = service && catalog.category(service.category);

  useEffect(() => {
    if (p && !serviceId && p.services.length === 1) setServiceId(p.services[0].id);
  }, [p, serviceId]);
  useEffect(() => {
    const def = addresses.data?.find((a) => a.isDefault);
    if (def && !f.eventAddress) {
      setF((x) => ({ ...x, eventAddress: [def.addressLine1, def.addressLine2, def.landmark, def.postalCode].filter(Boolean).join(', '), eventCity: def.city }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.data]);

  /** Fills date, time, guests and city from the event (only fields the customer has not typed yet, unless forced). */
  const applyEvent = (ev, force) => {
    if (!ev) return;
    setF((x) => ({
      ...x,
      eventDate: force || !x.eventDate ? (ev.eventDate >= isoDate() ? ev.eventDate : x.eventDate) : x.eventDate,
      eventTime: ev.eventTime && (force || x.eventTime === '19:00') ? ev.eventTime : x.eventTime,
      guestCount: force || !x.guestCount ? String(ev.guests) : x.guestCount,
      eventCity: force || !x.eventCity ? ev.city : x.eventCity,
    }));
  };
  useEffect(() => {
    if (!myEvents.data) return;
    const ev = openEvents.find((e) => e.id === eventId);
    if (ev) applyEvent(ev, false);
    else if (eventId) setEventId(''); // finished/cancelled or not the customer's event
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEvents.data]);

  // The price shown is always calculated by the server, exactly as the booking will be.
  const isChef = !!category?.culinary;
  const hasMenu = isChef && !!(menu.data?.items.length || menu.data?.menus.length);
  const missing = hasMenu ? missingChoices(pick, menu.data) : [];
  const selection = hasMenu ? toSelection(pick) : undefined;
  const estInput = service && Number(f.guestCount) >= 1 && !missing.length
    ? JSON.stringify({ serviceId, guests: Number(f.guestCount), hours: Number(f.hours) || undefined, days: Number(f.days) || undefined, menu: selection })
    : null;
  const estKey = useDebounced(estInput, 350);
  const est = useQuery({
    queryKey: ['estimate', providerId, estKey],
    queryFn: () => api.providers.estimate(providerId, JSON.parse(estKey)),
    enabled: !!estKey && estKey === estInput,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const submit = useMutation({
    mutationFn: (body) => api.bookings.create(body),
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event'] });
      navigate(`/bookings/${b.id}`, { replace: true, state: { justCreated: true } });
    },
  });

  if (provider.isLoading) return <Spinner />;
  if (provider.error) return <div className="page py-10"><EmptyState title="This provider is not available">{provider.error.message}</EmptyState></div>;

  const validate = () => {
    const e = {};
    if (!service) e.service = 'Choose a service.';
    if (!f.eventDate) e.eventDate = 'Choose the date.';
    if (!f.eventTime) e.eventTime = 'Choose the time.';
    const g = Number(f.guestCount);
    if (!g || g < 1) e.guestCount = 'Enter the number of guests.';
    else if (service?.minGuests && g < service.minGuests) e.guestCount = `This service needs at least ${service.minGuests} guests.`;
    else if (service?.maxGuests && g > service.maxGuests) e.guestCount = `This service serves up to ${service.maxGuests} guests.`;
    if (!f.eventAddress.trim()) e.eventAddress = 'Enter where the service is needed.';
    if (!f.eventCity.trim()) e.eventCity = 'Enter the city.';
    if (service?.pricingModel === 'PER_HOUR' && !(Number(f.hours) >= 1)) e.hours = 'How many hours do you need?';
    if (service?.pricingModel === 'PER_DAY' && !(Number(f.days) >= 1)) e.days = 'How many days do you need?';
    if (missing.length) e.menu = `Finish your menu: ${missing.join(', ')}.`;
    setErrors(e);
    return !Object.keys(e).length;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const clean = Object.fromEntries(Object.entries(details).filter(([, v]) => v && String(v).trim()));
    submit.mutate({
      providerId, serviceId, eventDate: f.eventDate, eventTime: f.eventTime, guestCount: Number(f.guestCount),
      eventAddress: f.eventAddress.trim(), eventCity: f.eventCity.trim(),
      hours: f.hours ? Number(f.hours) : undefined, days: f.days ? Number(f.days) : undefined,
      cuisinePreference: f.cuisinePreference || undefined, budget: f.budget ? Number(f.budget) : undefined,
      specialInstructions: f.specialInstructions.trim() || undefined, details: clean, menu: selection,
      eventId: eventId || undefined,
    });
  };

  const atHome = service?.deliveryMode === 'CHEF_VISITS_HOME';

  return (
    <div className="page max-w-3xl pb-16">
      <div className="flex items-center gap-3 pt-5">
        <Link to={`/p/${providerId}`} className="btn-icon -ml-2" aria-label="Back to profile"><ArrowLeft className="w-5 h-5" /></Link>
        <Avatar src={p.avatarUrl} name={p.name} size={40} />
        <div className="min-w-0">
          <p className="t-caption">Booking request</p>
          <h1 className="t-h3 truncate">{p.businessName || p.name}</h1>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-8 mt-6" noValidate>
        <fieldset>
          <legend className="t-h4 mb-3">1. Choose a service</legend>
          <div className="flex flex-col gap-2" role="radiogroup">
            {p.services.map((s) => (
              <label key={s.id} className={cx('panel p-4 flex items-start gap-3 cursor-pointer', serviceId === s.id && 'border-brand bg-pale')}>
                <input type="radio" name="service" className="mt-1 accent-brand" checked={serviceId === s.id} onChange={() => setServiceId(s.id)} />
                <span className="min-w-0 flex-1">
                  <span className="t-h4 block break-words">{s.title}</span>
                  <span className="t-caption block">{catalog.categoryLabel(s.category)} · {catalog.modeLabels[s.deliveryMode]}</span>
                </span>
                <span className="t-small font-semibold shrink-0">{priceLabel(s.price, s.pricingModel, catalog.pricingLabels)}</span>
              </label>
            ))}
          </div>
          {errors.service && <p className="t-caption !text-danger mt-2">{errors.service}</p>}
        </fieldset>

        {service && (
          <>
            <fieldset className="grid sm:grid-cols-2 gap-4">
              <legend className="t-h4 mb-3 col-span-full">2. When and where</legend>
              {openEvents.length > 0 && (
                <Field as="select" label="For one of your events?" className="col-span-full" value={eventId}
                  hint={eventId ? 'This booking will appear on the event checklist and budget.' : undefined}
                  onChange={(e) => { setEventId(e.target.value); applyEvent(openEvents.find((x) => x.id === e.target.value), true); }}>
                  <option value="">Not for a planned event</option>
                  {openEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.title} · {ev.eventDate}</option>)}
                </Field>
              )}
              <Field label="Date" type="date" min={isoDate()} value={f.eventDate} onChange={set('eventDate')} error={errors.eventDate} required />
              <Field label="Start time" type="time" value={f.eventTime} onChange={set('eventTime')} error={errors.eventTime} required />
              <Field label="Number of guests" type="number" inputMode="numeric" min="1" value={f.guestCount} onChange={set('guestCount')} error={errors.guestCount} required
                hint={service.minGuests || service.maxGuests ? `This service: ${service.minGuests || 1}–${service.maxGuests || 'any'} guests` : undefined} />
              {service.pricingModel === 'PER_HOUR' && <Field label="Hours needed" type="number" min="1" max="24" value={f.hours} onChange={set('hours')} error={errors.hours} required />}
              {service.pricingModel === 'PER_DAY' && <Field label="Days needed" type="number" min="1" max="30" value={f.days} onChange={set('days')} error={errors.days} required />}
              {addresses.data?.length > 0 && (
                <Field as="select" label="Saved address" className="col-span-full" defaultValue=""
                  onChange={(e) => {
                    const a = addresses.data.find((x) => x.id === e.target.value);
                    if (a) setF((x) => ({ ...x, eventAddress: [a.addressLine1, a.addressLine2, a.landmark, a.postalCode].filter(Boolean).join(', '), eventCity: a.city }));
                  }}>
                  <option value="" disabled>Fill from a saved address</option>
                  {addresses.data.map((a) => <option key={a.id} value={a.id}>{a.addressLine1}, {a.city}</option>)}
                </Field>
              )}
              <Field as="textarea" rows={2} label={atHome ? 'Your home address' : 'Event address'} className="col-span-full"
                value={f.eventAddress} onChange={set('eventAddress')} error={errors.eventAddress} required
                hint="Shared with the provider only after they confirm." />
              <Field label="City" value={f.eventCity} onChange={set('eventCity')} error={errors.eventCity} required />
              <Field label="Your budget (₹, optional)" type="number" inputMode="numeric" min="0" value={f.budget} onChange={set('budget')} />
            </fieldset>

            {hasMenu && (
              <fieldset>
                <legend className="t-h4 mb-3">3. Menu</legend>
                <MenuPicker menu={menu.data} value={pick} onChange={setPick} guests={f.guestCount} catalog={catalog} />
                {errors.menu && missing.length > 0 && <p className="t-caption !text-danger mt-2">{errors.menu}</p>}
              </fieldset>
            )}

            <fieldset className="grid sm:grid-cols-2 gap-4">
              <legend className="t-h4 mb-3 col-span-full">{hasMenu ? '4' : '3'}. Your requirements</legend>
              {isChef ? (
                <>
                  <Field as="select" label="Cuisine" value={f.cuisinePreference} onChange={set('cuisinePreference')}>
                    <option value="">No preference</option>
                    {p.cuisines.map((c) => <option key={c.code} value={c.label}>{c.label}</option>)}
                    {p.customCuisines && <option value={p.customCuisines}>{p.customCuisines}</option>}
                  </Field>
                  <Field as="select" label="Food preference" value={details.dietary || ''} onChange={setD('dietary')}>
                    <option value="">Select</option>
                    {DIETARY.map((d) => <option key={d}>{d}</option>)}
                  </Field>
                  {(!hasMenu || pick.mode === 'none') && (
                    <Field as="textarea" rows={3} className="col-span-full" label="Menu you have in mind" placeholder="e.g. Pulihora, gongura pachadi, pappu, two curries, payasam"
                      value={details.menu || ''} onChange={setD('menu')} maxLength={1000} />
                  )}
                  {atHome && (
                    <>
                      <Field as="select" label="Ingredients" value={details.ingredients || ''} onChange={setD('ingredients')}>
                        <option value="">Select</option>
                        <option>I will provide ingredients</option>
                        <option>Chef brings ingredients (may be charged extra)</option>
                      </Field>
                      <Field as="select" label="Kitchen available?" value={details.kitchen || ''} onChange={setD('kitchen')}>
                        <option value="">Select</option>
                        <option>Yes, fully equipped</option>
                        <option>Basic kitchen</option>
                        <option>No kitchen — need setup</option>
                      </Field>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Field label="Occasion" placeholder="e.g. Wedding, birthday, corporate event" value={details.occasion || ''} onChange={setD('occasion')} maxLength={200} />
                  <Field label="Venue type" placeholder="e.g. Banquet hall, home, outdoor lawn" value={details.venue || ''} onChange={setD('venue')} maxLength={200} />
                </>
              )}
              <Field as="textarea" rows={3} className="col-span-full" label="Anything else the provider should know?"
                value={f.specialInstructions} onChange={set('specialInstructions')} maxLength={2000} />
            </fieldset>

            <section className="panel p-4 bg-canvas" aria-live="polite">
              <p className="t-h4">{service.pricingModel === 'CUSTOM_QUOTE' ? 'Price' : 'Estimated price'}</p>
              <div className="mt-2">
                <PriceBreakdown catalog={catalog} missing={missing} est={estInput ? est.data : null}
                  pending={!!estInput && (est.isFetching || estKey !== estInput)} error={estInput ? est.error?.message : null} />
              </div>
              <p className="t-caption mt-2 flex gap-1.5"><Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                {service.pricingModel === 'CUSTOM_QUOTE'
                  ? 'The provider will review your request and send a quotation.'
                  : 'Based on the listed prices. The provider confirms the final amount — you pay nothing now.'}
              </p>
            </section>

            <Alert>{submit.error?.message}</Alert>
            <Button type="submit" size="lg" loading={submit.isPending}>Send booking request</Button>
          </>
        )}
      </form>
    </div>
  );
}
