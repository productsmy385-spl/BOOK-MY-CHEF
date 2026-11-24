import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, FileText, ImagePlus, Link2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { priceLabel, VERIFICATION, WEEKDAYS } from '../../lib/format';
import { uploadFile } from '../../lib/upload';
import { Alert, Badge, Button, Checkbox, Drawer, Field, Modal, cx } from '../../components/ui';
import { useProviderMutation } from './useProviderMe';

const fieldErrors = (m) => m.error?.fields || {};
const generalError = (m) => (m.error && !Object.keys(m.error.fields || {}).length ? m.error.message : null);

function SaveBar({ mutation, label = 'Save', disabled, onSave }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (mutation.isSuccess) { setShown(true); const t = setTimeout(() => setShown(false), 2500); return () => clearTimeout(t); }
    return undefined;
  }, [mutation.isSuccess, mutation.submittedAt]);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={onSave} loading={mutation.isPending} disabled={disabled}>{label}</Button>
      {shown && <span className="t-small text-success" role="status">Saved</span>}
      {generalError(mutation) && <Alert className="w-full">{generalError(mutation)}</Alert>}
    </div>
  );
}

// ------------------------------------------------------------------ basics

export function ProfileSection({ me, onSaved }) {
  const [f, setF] = useState(() => ({
    name: me.name || '', businessName: me.businessName || '', bio: me.bio || '', experienceYears: me.experienceYears ?? 0,
    avatarUrl: me.avatarUrl || '', coverImageUrl: me.coverImageUrl || '', city: me.city || '', locality: me.locality || '',
    baseLatitude: me.baseLatitude ?? '', baseLongitude: me.baseLongitude ?? '', maxTravelDistanceKm: me.maxTravelDistanceKm ?? 25,
    fssaiLicenseNumber: me.fssaiLicenseNumber || '', acceptingBookings: me.acceptingBookings,
  }));
  const [geoMsg, setGeoMsg] = useState('');
  const m = useProviderMutation((body) => api.me.profile(body));
  const fe = fieldErrors(m);
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });

  const locate = () => {
    setGeoMsg('');
    if (!navigator.geolocation) return setGeoMsg('Location is not available on this device.');
    navigator.geolocation.getCurrentPosition(
      (p) => { setF((x) => ({ ...x, baseLatitude: p.coords.latitude.toFixed(6), baseLongitude: p.coords.longitude.toFixed(6) })); setGeoMsg('Location captured. Save to apply.'); },
      () => setGeoMsg('Location permission denied.'), { timeout: 10000 });
  };

  const save = () => m.mutate({
    ...f, experienceYears: Number(f.experienceYears) || 0, maxTravelDistanceKm: Number(f.maxTravelDistanceKm) || 25,
    baseLatitude: f.baseLatitude === '' ? null : Number(f.baseLatitude), baseLongitude: f.baseLongitude === '' ? null : Number(f.baseLongitude),
  }, { onSuccess: onSaved });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Your name" value={f.name} onChange={set('name')} error={fe.name} required />
        <Field label="Business name" hint="Optional" value={f.businessName} onChange={set('businessName')} />
        <Field label="Years of experience" type="number" min="0" max="70" value={f.experienceYears} onChange={set('experienceYears')} error={fe.experienceYears} />
        <Field label="FSSAI licence number" hint="For food businesses" value={f.fssaiLicenseNumber} onChange={set('fssaiLicenseNumber')} />
      </div>
      <Field as="textarea" rows={5} label="About you and your work" hint={`${f.bio.trim().length}/2000 · at least 30 characters to publish`}
        value={f.bio} onChange={set('bio')} maxLength={2000} error={fe.bio} />
      <div className="grid sm:grid-cols-2 gap-4">
        <ImageField label="Profile photo" value={f.avatarUrl} onChange={set('avatarUrl')} error={fe.avatarUrl} />
        <ImageField label="Cover image" value={f.coverImageUrl} onChange={set('coverImageUrl')} error={fe.coverImageUrl} />
      </div>
      <h3 className="t-h4 mt-2">Location & service area</h3>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="City" value={f.city} onChange={set('city')} error={fe.city} required />
        <Field label="Area / locality" value={f.locality} onChange={set('locality')} />
        <Field label="Travel radius (km)" type="number" min="1" max="200" value={f.maxTravelDistanceKm} onChange={set('maxTravelDistanceKm')} error={fe.maxTravelDistanceKm} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={locate}>{f.baseLatitude !== '' ? 'Update base location' : 'Set base location from this device'}</Button>
        <span className="t-caption">{f.baseLatitude !== '' ? `Set (${Number(f.baseLatitude).toFixed(3)}, ${Number(f.baseLongitude).toFixed(3)}) — used for “near me” searches; never shown publicly.` : 'Needed to appear in “near me” searches.'}</span>
      </div>
      {geoMsg && <p className="t-caption">{geoMsg}</p>}
      <Checkbox label="Accepting new bookings" description="Turn off to pause new requests without unpublishing." checked={!!f.acceptingBookings} onChange={set('acceptingBookings')} />
      <SaveBar mutation={m} onSave={save} disabled={!f.name.trim() || !f.city.trim()} />
    </div>
  );
}

/** URL input with optional upload. Upload is offered only when the server has storage configured. */
export function ImageField({ label, value, onChange, error, accept = 'image/jpeg,image/png,image/webp' }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setMsg('');
    try {
      const r = await uploadFile(file);
      onChange({ target: { value: r.url } });
    } catch (err) {
      setMsg(err.status === 503 ? 'Uploads are not set up yet — paste an image link instead.' : err.message);
    } finally { setBusy(false); }
  };
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="t-label">{label}</span>
      <div className="flex gap-2 items-center">
        {value ? <img src={value} alt="" className="w-11 h-11 rounded-md object-cover bg-canvas shrink-0" /> : <span className="w-11 h-11 rounded-md bg-canvas shrink-0 flex items-center justify-center"><ImagePlus className="w-5 h-5 text-muted" /></span>}
        <input className={cx('field-input min-w-0', error && 'field-invalid')} type="url" placeholder="https://…" value={value} onChange={onChange} aria-label={`${label} link`} />
        <Button variant="outline" size="sm" icon={Upload} loading={busy} onClick={() => input.current?.click()} aria-label={`Upload ${label}`} />
        <input ref={input} type="file" accept={accept} hidden onChange={pick} />
      </div>
      {(error || msg) && <p className={cx('t-caption', error && '!text-danger')}>{error || msg}</p>}
    </div>
  );
}

// ------------------------------------------------------------------ categories & cuisines

export function CategoriesSection({ me, onSaved }) {
  const catalog = useCatalog();
  const [sel, setSel] = useState(me.categories);
  const m = useProviderMutation((c) => api.me.categories(c));
  const removed = me.categories.filter((c) => !sel.includes(c));
  return (
    <div className="flex flex-col gap-4">
      {catalog.groups.map((g) => (
        <div key={g.code}>
          <p className="t-label mb-2">{g.label}</p>
          <div className="flex flex-wrap gap-2">
            {catalog.categories.filter((c) => c.group === g.code).map((c) => (
              <button key={c.code} aria-pressed={sel.includes(c.code)} className={cx('chip', sel.includes(c.code) && 'chip-active')}
                onClick={() => setSel((s) => (s.includes(c.code) ? s.filter((x) => x !== c.code) : [...s, c.code]))}>{c.label}</button>
            ))}
          </div>
        </div>
      ))}
      {removed.length > 0 && <Alert tone="warning">Services under {removed.map(catalog.categoryLabel).join(', ')} will be hidden from customers.</Alert>}
      <SaveBar mutation={m} disabled={!sel.length} onSave={() => m.mutate(sel, { onSuccess: onSaved })} />
    </div>
  );
}

export function CuisinesSection({ me, onSaved }) {
  const catalog = useCatalog();
  const [sel, setSel] = useState(me.cuisines.map((c) => c.code));
  const [custom, setCustom] = useState(me.customCuisines || '');
  const m = useProviderMutation((d) => api.me.cuisines(d));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {catalog.cuisines.map((c) => (
          <button key={c.code} aria-pressed={sel.includes(c.code)} className={cx('chip', sel.includes(c.code) && 'chip-active')}
            onClick={() => setSel((s) => (s.includes(c.code) ? s.filter((x) => x !== c.code) : [...s, c.code]))}>{c.label}</button>
        ))}
      </div>
      <Field label="Other cuisines or specialities" hint="e.g. Chettinad, Kerala sadya, millet dishes" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={255} />
      <SaveBar mutation={m} onSave={() => m.mutate({ cuisines: sel, customCuisines: custom }, { onSuccess: onSaved })} />
    </div>
  );
}

// ------------------------------------------------------------------ services & pricing

const EMPTY_SERVICE = { category: '', title: '', description: '', deliveryMode: '', pricingModel: '', price: '', minGuests: '', maxGuests: '', active: true };

export function ServicesSection({ me }) {
  const catalog = useCatalog();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const del = useProviderMutation((id) => api.me.deleteService(id));
  return (
    <div className="flex flex-col gap-3">
      {!me.categories.length && <Alert tone="info">Choose the services you offer first.</Alert>}
      {me.services.length === 0 && me.categories.length > 0 && <p className="t-small text-muted">Add at least one service with its price so customers can book you.</p>}
      {me.services.map((s) => (
        <div key={s.id} className={cx('panel p-4 flex items-start gap-3', !s.active && 'opacity-70')}>
          <div className="min-w-0 flex-1">
            <p className="t-caption">{catalog.categoryLabel(s.category)} · {catalog.modeLabels[s.deliveryMode]}</p>
            <p className="t-h4 break-words">{s.title}</p>
            <p className="t-small mt-0.5">{priceLabel(s.price, s.pricingModel, catalog.pricingLabels)}
              {(s.minGuests || s.maxGuests) && <span className="text-muted"> · {s.minGuests || 1}–{s.maxGuests || 'any'} guests</span>}</p>
            {!s.active && <Badge className="mt-2">Hidden</Badge>}
          </div>
          <button className="btn-icon" aria-label={`Edit ${s.title}`} onClick={() => setEditing({ ...EMPTY_SERVICE, ...s, price: s.price ?? '', minGuests: s.minGuests ?? '', maxGuests: s.maxGuests ?? '', description: s.description || '' })}><Pencil className="w-4 h-4" /></button>
          <button className="btn-icon text-danger" aria-label={`Remove ${s.title}`} onClick={() => setDeleting(s)}><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      {me.categories.length > 0 && (
        <Button variant="outline" icon={Plus} className="self-start" onClick={() => setEditing({ ...EMPTY_SERVICE, category: me.categories[0] })}>Add a service</Button>
      )}
      <ServiceDrawer value={editing} me={me} onClose={() => setEditing(null)} />
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Remove this service?"
        footer={<><Button variant="outline" onClick={() => setDeleting(null)}>Keep</Button><Button variant="navy" loading={del.isPending} onClick={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}>Remove</Button></>}>
        <p className="t-body text-muted">“{deleting?.title}” will no longer be shown to customers. Past bookings keep their details.</p>
        <Alert className="mt-3">{del.error?.message}</Alert>
      </Modal>
    </div>
  );
}

function ServiceDrawer({ value, me, onClose }) {
  const catalog = useCatalog();
  const [s, setS] = useState(value);
  useEffect(() => setS(value), [value]);
  const m = useProviderMutation((body) => (s?.id ? api.me.updateService(s.id, body) : api.me.addService(body)));
  if (!value || !s) return null;
  const cat = catalog.category(s.category);
  const set = (k) => (e) => setS({ ...s, [k]: e?.target ? e.target.value : e });
  const fe = fieldErrors(m);
  const quote = s.pricingModel === 'CUSTOM_QUOTE';
  const onCategory = (e) => {
    const next = catalog.category(e.target.value);
    setS({ ...s, category: e.target.value,
      pricingModel: next?.pricingModels.includes(s.pricingModel) ? s.pricingModel : '',
      deliveryMode: next?.deliveryModes.includes(s.deliveryMode) ? s.deliveryMode : next?.deliveryModes.length === 1 ? next.deliveryModes[0] : '' });
  };
  const save = () => m.mutate({
    category: s.category, title: s.title.trim(), description: s.description.trim() || null, deliveryMode: s.deliveryMode,
    pricingModel: s.pricingModel, price: quote || s.price === '' ? null : Number(s.price),
    minGuests: s.minGuests === '' ? null : Number(s.minGuests), maxGuests: s.maxGuests === '' ? null : Number(s.maxGuests), active: s.active,
  }, { onSuccess: onClose });

  return (
    <Drawer open onClose={onClose} title={s.id ? 'Edit service' : 'New service'}
      footer={<Button className="w-full" loading={m.isPending} onClick={save}
        disabled={!s.category || !s.title.trim() || !s.deliveryMode || !s.pricingModel || (!quote && s.price === '')}>Save service</Button>}>
      <div className="flex flex-col gap-4">
        <Field as="select" label="Category" value={s.category} onChange={onCategory} required>
          {me.categories.map((c) => <option key={c} value={c}>{catalog.categoryLabel(c)}</option>)}
        </Field>
        <Field label="Service name" placeholder={cat?.culinary ? 'e.g. Andhra family meal cooked at your home' : 'e.g. Full-day wedding coverage'}
          value={s.title} onChange={set('title')} error={fe.title} maxLength={150} required />
        <Field as="textarea" rows={3} label="What's included" value={s.description} onChange={set('description')} maxLength={2000} />
        {cat && (
          <Field as="select" label="How you deliver it" value={s.deliveryMode} onChange={set('deliveryMode')} required>
            <option value="" disabled>Choose</option>
            {cat.deliveryModes.map((d) => <option key={d} value={d}>{catalog.modeLabels[d]}</option>)}
          </Field>
        )}
        {cat && (
          <fieldset>
            <legend className="t-label mb-2">Pricing <span className="text-danger">*</span></legend>
            <div className="flex flex-wrap gap-2">
              {cat.pricingModels.map((p) => (
                <button key={p} type="button" aria-pressed={s.pricingModel === p} className={cx('chip', s.pricingModel === p && 'chip-active')}
                  onClick={() => setS({ ...s, pricingModel: p })}>{catalog.pricingLabels[p]}</button>
              ))}
            </div>
          </fieldset>
        )}
        {s.pricingModel && !quote && (
          <Field label={`Price (₹ ${catalog.pricingLabels[s.pricingModel]})`} type="number" min="1" inputMode="decimal" value={s.price} onChange={set('price')} error={fe.price} required />
        )}
        {quote && <Alert tone="info">Customers will send their requirements and you reply with a quotation.</Alert>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Min guests" type="number" min="1" value={s.minGuests} onChange={set('minGuests')} error={fe.minGuests} />
          <Field label="Max guests" type="number" min="1" value={s.maxGuests} onChange={set('maxGuests')} error={fe.maxGuests} />
        </div>
        <Checkbox label="Show this service to customers" checked={!!s.active} onChange={set('active')} />
        {generalError(m) && <Alert>{generalError(m)}</Alert>}
      </div>
    </Drawer>
  );
}

// ------------------------------------------------------------------ availability

export function AvailabilitySection({ me, onSaved }) {
  const byDay = Object.fromEntries(me.weeklyAvailability.map((w) => [w.dayOfWeek, w]));
  const [anyDay, setAnyDay] = useState(me.weeklyAvailability.length === 0);
  const [days, setDays] = useState(() => WEEKDAYS.map((_, i) => byDay[i + 1] || { dayOfWeek: i + 1, startTime: '09:00', endTime: '21:00', active: true }));
  const [rules, setRules] = useState(me.bookingRules);
  const m = useProviderMutation((d) => api.me.availability(d));
  const setDay = (i, k, v) => setDays((ds) => ds.map((d, j) => (j === i ? { ...d, [k]: v } : d)));
  const invalid = !anyDay && days.some((d) => d.active && d.startTime >= d.endTime);

  return (
    <div className="flex flex-col gap-5">
      <Checkbox label="I can work any day" description="Customers can request any date; you confirm each booking." checked={anyDay} onChange={setAnyDay} />
      {!anyDay && (
        <div className="panel divide-y divide-line">
          {days.map((d, i) => (
            <div key={d.dayOfWeek} className="flex flex-wrap items-center gap-3 p-3">
              <label className="flex items-center gap-2 w-32 shrink-0">
                <input type="checkbox" className="w-[18px] h-[18px] accent-brand" checked={d.active} onChange={(e) => setDay(i, 'active', e.target.checked)} />
                <span className="t-body">{WEEKDAYS[i]}</span>
              </label>
              {d.active ? (
                <div className="flex items-center gap-2">
                  <input type="time" className="field-input h-9 w-[120px]" value={d.startTime} onChange={(e) => setDay(i, 'startTime', e.target.value)} aria-label={`${WEEKDAYS[i]} start`} />
                  <span className="t-small text-muted">to</span>
                  <input type="time" className="field-input h-9 w-[120px]" value={d.endTime} onChange={(e) => setDay(i, 'endTime', e.target.value)} aria-label={`${WEEKDAYS[i]} end`} />
                </div>
              ) : <span className="t-small text-muted">Not working</span>}
            </div>
          ))}
        </div>
      )}
      {invalid && <Alert>Start time must be before end time.</Alert>}
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Advance notice (hours)" type="number" min="0" max="720" value={rules.advanceNoticeHours} onChange={(e) => setRules({ ...rules, advanceNoticeHours: e.target.value })} />
        <Field label="Bookings per day" type="number" min="1" max="20" value={rules.maxDailyBookings} onChange={(e) => setRules({ ...rules, maxDailyBookings: e.target.value })} />
        <Field label="Book up to (days ahead)" type="number" min="1" max="730" value={rules.maxAdvanceDays} onChange={(e) => setRules({ ...rules, maxAdvanceDays: e.target.value })} />
      </div>
      <SaveBar mutation={m} disabled={invalid} onSave={() => m.mutate({
        weekly: anyDay ? [] : days.map((d) => ({ dayOfWeek: d.dayOfWeek, startTime: d.startTime, endTime: d.endTime, active: d.active })),
        advanceNoticeHours: Number(rules.advanceNoticeHours) || 0, maxDailyBookings: Number(rules.maxDailyBookings) || 1, maxAdvanceDays: Number(rules.maxAdvanceDays) || 365,
      }, { onSuccess: onSaved })} />
    </div>
  );
}

// ------------------------------------------------------------------ portfolio & documents

export function PortfolioSection({ me }) {
  const [url, setUrl] = useState('');
  const [type, setType] = useState('IMAGE');
  const [title, setTitle] = useState('');
  const add = useProviderMutation((d) => api.me.addPortfolio(d));
  const del = useProviderMutation((id) => api.me.deletePortfolio(id));
  return (
    <div className="flex flex-col gap-4">
      {me.portfolio.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {me.portfolio.map((p) => (
            <div key={p.id} className="relative group">
              {p.mediaType === 'VIDEO'
                ? <video src={p.url} className="w-full aspect-square object-cover rounded-md bg-canvas" preload="metadata" />
                : <img src={p.url} alt={p.title || ''} className="w-full aspect-square object-cover rounded-md bg-canvas" loading="lazy" />}
              <button onClick={() => del.mutate(p.id)} aria-label="Remove" className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-white/95 shadow-card flex items-center justify-center text-danger"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="panel p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          {['IMAGE', 'VIDEO'].map((t) => <button key={t} aria-pressed={type === t} onClick={() => setType(t)} className={cx('chip', type === t && 'chip-active')}>{t === 'IMAGE' ? 'Photo' : 'Video'}</button>)}
        </div>
        <ImageField label={type === 'IMAGE' ? 'Photo' : 'Video'} value={url} onChange={(e) => setUrl(e.target.value)} accept={type === 'IMAGE' ? 'image/jpeg,image/png,image/webp' : 'video/mp4'} />
        <Field label="Caption (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
        <Button variant="outline" icon={Plus} className="self-start" disabled={!/^https:\/\//.test(url)} loading={add.isPending}
          onClick={() => add.mutate({ mediaType: type, url, title: title || undefined }, { onSuccess: () => { setUrl(''); setTitle(''); } })}>Add to portfolio</Button>
        <Alert>{add.error?.message || del.error?.message}</Alert>
      </div>
    </div>
  );
}

const DOC_TYPES = [['AADHAAR_KYC', 'Aadhaar / ID proof'], ['PAN', 'PAN card'], ['FSSAI', 'FSSAI licence'], ['BUSINESS_REGISTRATION', 'Business registration'], ['CULINARY_DEGREE', 'Culinary certificate'], ['POLICE_BACKGROUND', 'Police verification'], ['OTHER', 'Other']];

export function DocumentsSection({ me }) {
  const [docType, setDocType] = useState('AADHAAR_KYC');
  const [url, setUrl] = useState('');
  const add = useProviderMutation((d) => api.me.addDocument(d));
  const v = VERIFICATION[me.verificationStatus];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2"><span className="t-small">Status:</span><Badge tone={v.tone}>{v.label}</Badge></div>
      <p className="t-small text-muted">An administrator reviews your documents. Verified providers get a badge and appear in “verified only” searches. Documents are never shown to customers.</p>
      {me.documents.length > 0 && (
        <ul className="panel divide-y divide-line">
          {me.documents.map((d) => (
            <li key={d.id} className="p-3 flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted shrink-0" />
              <span className="min-w-0 flex-1 t-small truncate">{DOC_TYPES.find(([k]) => k === d.documentType)?.[1] || d.documentType} · {d.fileName}</span>
              <Badge tone={d.status === 'APPROVED' ? 'green' : d.status === 'REJECTED' ? 'red' : 'amber'}>{d.status.toLowerCase()}</Badge>
            </li>
          ))}
        </ul>
      )}
      <div className="panel p-4 flex flex-col gap-3">
        <Field as="select" label="Document type" value={docType} onChange={(e) => setDocType(e.target.value)}>
          {DOC_TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Field>
        <ImageField label="Document (image or PDF)" value={url} onChange={(e) => setUrl(e.target.value)} accept="image/jpeg,image/png,image/webp,application/pdf" />
        <Button variant="outline" icon={Link2} className="self-start" disabled={!/^https:\/\//.test(url)} loading={add.isPending}
          onClick={() => add.mutate({ documentType: docType, url, fileName: decodeURIComponent(url.split('/').pop().split('?')[0]).slice(0, 255) || docType },
            { onSuccess: () => setUrl('') })}>Submit document</Button>
        <Alert>{add.error?.message}</Alert>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ publish

export function PublishSection({ me }) {
  const publish = useProviderMutation(() => api.me.publish());
  const unpublish = useProviderMutation(() => api.me.unpublish());
  const ready = me.publishChecklist.every((i) => i.done);
  const live = me.onboardingStatus === 'PUBLISHED';
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {me.publishChecklist.map((i) => (
          <li key={i.key} className="flex items-center gap-2 t-body">
            {i.done ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : <Circle className="w-5 h-5 text-line shrink-0" />}
            <span className={i.done ? '' : 'text-muted'}>{i.label}</span>
          </li>
        ))}
      </ul>
      {live
        ? <Alert tone="success">Your profile is live. Customers can find and book you.</Alert>
        : <Alert tone="info">Your profile is not visible to customers yet.</Alert>}
      <div className="flex flex-wrap gap-2">
        {!live && <Button disabled={!ready} loading={publish.isPending} onClick={() => publish.mutate()}>Publish my profile</Button>}
        {live && <Button variant="outline" loading={unpublish.isPending} onClick={() => unpublish.mutate()}>Hide from customers</Button>}
        {live && <a href={`/p/${me.id}`} target="_blank" rel="noreferrer" className="btn btn-ghost">View public profile</a>}
      </div>
      <Alert>{publish.error?.message || unpublish.error?.message}</Alert>
    </div>
  );
}
