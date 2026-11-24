import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Pencil, Plus, Trash2, UtensilsCrossed, X } from 'lucide-react';
import { api } from '../../services/api';
import { useCatalog } from '../../hooks/useCatalog';
import { money } from '../../lib/format';
import { uploadFile } from '../../lib/upload';
import { Alert, Badge, Button, Checkbox, Drawer, EmptyState, Field, Modal, PageHeader, Spinner, Tabs, cx } from '../../components/ui';
import { DietMark } from '../../components/menu/MenuBits';
import { useProviderMe } from './useProviderMe';

const fieldErrors = (m) => m.error?.fields || {};
const generalError = (m) => (m.error && !Object.keys(m.error.fields || {}).length ? m.error.message : null);

/** Every menu write returns the provider's full menu; keep the cache and the public views in step. */
function useMenuMutation(fn, providerId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (data) => {
      qc.setQueryData(['providerMenu'], data);
      qc.invalidateQueries({ queryKey: ['menu', providerId] });
    },
  });
}

export default function MenuPage() {
  const me = useProviderMe();
  const catalog = useCatalog();
  const menu = useQuery({ queryKey: ['providerMenu'], queryFn: api.me.menu });
  const [tab, setTab] = useState('dishes');

  if (me.isLoading || menu.isLoading || catalog.isLoading) return <Spinner />;
  const err = me.error || menu.error;
  if (err) return <div className="page py-8"><Alert>{err.message}</Alert></div>;

  const culinary = me.data.categories.some((c) => catalog.category(c)?.culinary);
  if (!culinary) {
    return (
      <div className="page max-w-3xl">
        <PageHeader title="Food menu" />
        <EmptyState icon={UtensilsCrossed} title="Menus are for chefs and caterers"
          action={<Link to="/provider/services" className="btn btn-outline">Service categories</Link>}>
          Add a chef or catering category to your services to publish dishes and set menus.
        </EmptyState>
      </div>
    );
  }

  const { items, menus } = menu.data;
  return (
    <div className="page max-w-3xl pb-10 flex flex-col gap-5">
      <PageHeader title="Food menu" subtitle="Customers pick from these when they book you, and see the price before they send a request." />
      <Tabs value={tab} onChange={setTab} options={[
        { value: 'dishes', label: `Dishes (${items.length})` },
        { value: 'sets', label: `Set menus (${menus.length})` },
      ]} />
      {tab === 'dishes'
        ? <DishList items={items} catalog={catalog} providerId={me.data.id} />
        : <SetMenuList menus={menus} items={items} catalog={catalog} providerId={me.data.id} onNeedDishes={() => setTab('dishes')} />}
      <HowPricingWorks />
    </div>
  );
}

function HowPricingWorks() {
  return (
    <section className="panel p-4 bg-canvas t-small flex flex-col gap-1.5">
      <h2 className="t-h4">How menu prices are used</h2>
      <p>All menu prices are <strong>per person</strong> and multiplied by the guest count.</p>
      <p>If the service a customer books is priced per person, per plate, per 100 guests or per package, the <strong>menu price replaces</strong> that rate.</p>
      <p>If it is priced per hour, per day or per event, the menu is the food cost and is <strong>added</strong> to your service charge.</p>
      <p>For services priced on quotation, the menu cost is shown to you as a guide and you send the quotation.</p>
    </section>
  );
}

// ------------------------------------------------------------------ dishes

const EMPTY_DISH = { name: '', description: '', course: 'MAIN_COURSE', diet: 'VEG', spiceLevel: 'MEDIUM', allergens: [], pricePerPerson: '', minServings: '', imageUrl: '', available: true };

function DishList({ items, catalog, providerId }) {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const del = useMenuMutation((id) => api.me.deleteDish(id), providerId);
  const toggle = useMenuMutation((d) => api.me.updateDish(d.id, dishBody({ ...d, available: !d.available })), providerId);
  const groups = catalog.menu.courses.map((c) => [c, items.filter((i) => i.course === c.code)]).filter(([, list]) => list.length);

  return (
    <div className="flex flex-col gap-5">
      {items.length === 0 && (
        <EmptyState icon={UtensilsCrossed} title="No dishes yet">Add the dishes you cook, with a price per person. You can then group them into set menus.</EmptyState>
      )}
      {groups.map(([course, list]) => (
        <section key={course.code}>
          <h2 className="t-label mb-2">{course.label}</h2>
          <ul className="flex flex-col gap-2">
            {list.map((d) => (
              <li key={d.id} className={cx('panel p-3 flex items-start gap-3', !d.available && 'opacity-70')}>
                {d.imageUrl
                  ? <img src={d.imageUrl} alt="" className="w-14 h-14 rounded-sm object-cover bg-canvas shrink-0" />
                  : <span className="w-14 h-14 rounded-sm bg-canvas text-muted flex items-center justify-center shrink-0"><UtensilsCrossed className="w-5 h-5" /></span>}
                <div className="min-w-0 flex-1">
                  <p className="t-h4 flex items-start gap-2 break-words"><DietMark diet={d.diet} className="mt-1" />{d.name}</p>
                  <p className="t-small mt-0.5">{money(d.pricePerPerson)} per person
                    {d.minServings && <span className="text-muted"> · min {d.minServings} guests</span>}
                    <span className="text-muted"> · {catalog.menu.spiceLabels[d.spiceLevel]}</span></p>
                  {d.allergens.length > 0 && <p className="t-caption mt-0.5">Contains: {d.allergens.map((a) => catalog.menu.allergenLabels[a]).join(', ')}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {!d.available && <Badge>Unavailable</Badge>}
                    <button className="t-caption text-navy hover:underline" onClick={() => toggle.mutate(d)} disabled={toggle.isPending}>
                      {d.available ? 'Mark unavailable' : 'Mark available'}
                    </button>
                  </div>
                </div>
                <button className="btn-icon" aria-label={`Edit ${d.name}`} onClick={() => setEditing({ ...EMPTY_DISH, ...d, pricePerPerson: String(d.pricePerPerson), minServings: d.minServings ?? '', description: d.description || '', imageUrl: d.imageUrl || '' })}><Pencil className="w-4 h-4" /></button>
                <button className="btn-icon text-danger" aria-label={`Remove ${d.name}`} onClick={() => setDeleting(d)}><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Alert>{toggle.error?.message}</Alert>
      <Button variant="outline" icon={Plus} className="self-start" onClick={() => setEditing({ ...EMPTY_DISH })}>Add a dish</Button>
      {editing && <DishDrawer value={editing} catalog={catalog} providerId={providerId} onClose={() => setEditing(null)} />}
      <Modal open={!!deleting} onClose={() => { setDeleting(null); del.reset(); }} title="Remove this dish?"
        footer={<><Button variant="outline" onClick={() => setDeleting(null)}>Keep</Button>
          <Button variant="navy" loading={del.isPending} onClick={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}>Remove</Button></>}>
        <p className="t-body text-muted">“{deleting?.name}” will be removed from your menu. Existing bookings keep the dishes they were made with.</p>
        <Alert className="mt-3">{del.error?.message}</Alert>
      </Modal>
    </div>
  );
}

function dishBody(d) {
  return {
    name: d.name.trim(), description: d.description?.trim() || null, course: d.course, diet: d.diet, spiceLevel: d.spiceLevel,
    allergens: d.allergens, pricePerPerson: Number(d.pricePerPerson),
    minServings: d.minServings === '' || d.minServings == null ? null : Number(d.minServings),
    imageUrl: d.imageUrl || null, available: d.available,
  };
}

function DishDrawer({ value, catalog, providerId, onClose }) {
  const [d, setD] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);
  const m = useMenuMutation((body) => (d.id ? api.me.updateDish(d.id, body) : api.me.addDish(body)), providerId);
  const fe = fieldErrors(m);
  const set = (k) => (e) => setD({ ...d, [k]: e?.target ? e.target.value : e });
  const valid = d.name.trim() && d.pricePerPerson !== '' && Number(d.pricePerPerson) >= 0;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      setD((x) => ({ ...x, imageUrl: url }));
    } catch (err) {
      setUploadError(err.status === 503 ? 'Photo uploads are not set up yet. You can save the dish without a photo.' : err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Drawer open onClose={onClose} title={d.id ? 'Edit dish' : 'New dish'}
      footer={<Button className="w-full" loading={m.isPending} disabled={!valid || uploading} onClick={() => m.mutate(dishBody(d), { onSuccess: onClose })}>Save dish</Button>}>
      <div className="flex flex-col gap-4">
        <Field label="Dish name" value={d.name} onChange={set('name')} error={fe.name} maxLength={150} required placeholder="e.g. Gongura mutton" />
        <Field as="select" label="Course" value={d.course} onChange={set('course')} required>
          {catalog.menu.courses.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </Field>
        <fieldset>
          <legend className="t-label mb-2">Food type <span className="text-danger">*</span></legend>
          <div className="flex flex-wrap gap-2">
            {catalog.menu.diets.map((o) => (
              <button key={o.code} type="button" aria-pressed={d.diet === o.code} className={cx('chip', d.diet === o.code && 'chip-active')}
                onClick={() => setD({ ...d, diet: o.code })}><DietMark diet={o.code} />{o.label}</button>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price per person (₹)" type="number" min="0" inputMode="decimal" value={d.pricePerPerson} onChange={set('pricePerPerson')} error={fe.pricePerPerson} required />
          <Field label="Minimum guests" type="number" min="1" inputMode="numeric" value={d.minServings} onChange={set('minServings')} error={fe.minServings} hint="Leave empty for any" />
        </div>
        <fieldset>
          <legend className="t-label mb-2">Spice level</legend>
          <div className="flex flex-wrap gap-2">
            {catalog.menu.spiceLevels.map((o) => (
              <button key={o.code} type="button" aria-pressed={d.spiceLevel === o.code} className={cx('chip', d.spiceLevel === o.code && 'chip-active')}
                onClick={() => setD({ ...d, spiceLevel: o.code })}>{o.label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="t-label mb-2">Contains (allergens)</legend>
          <div className="flex flex-wrap gap-2">
            {catalog.menu.allergens.map((o) => {
              const on = d.allergens.includes(o.code);
              return (
                <button key={o.code} type="button" aria-pressed={on} className={cx('chip', on && 'chip-active')}
                  onClick={() => setD({ ...d, allergens: on ? d.allergens.filter((x) => x !== o.code) : [...d.allergens, o.code] })}>{o.label}</button>
              );
            })}
          </div>
        </fieldset>
        <Field as="textarea" rows={3} label="Description" value={d.description} onChange={set('description')} error={fe.description} maxLength={500} />
        <div>
          <p className="t-label mb-2">Photo</p>
          {d.imageUrl ? (
            <div className="relative w-40">
              <img src={d.imageUrl} alt="" className="w-40 aspect-[4/3] object-cover rounded-md bg-canvas" />
              <button className="absolute top-1 right-1 btn-icon bg-white/95 w-8 h-8" aria-label="Remove photo" onClick={() => setD({ ...d, imageUrl: '' })}><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <Button variant="outline" size="sm" icon={ImagePlus} loading={uploading} onClick={() => fileRef.current?.click()}>Add a photo</Button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
          {uploadError && <p className="t-caption !text-danger mt-1">{uploadError}</p>}
        </div>
        <Checkbox label="Available to order" checked={!!d.available} onChange={set('available')} />
        <Alert>{generalError(m)}</Alert>
      </div>
    </Drawer>
  );
}

// ------------------------------------------------------------------ set menus

const newSection = () => ({ key: Math.random().toString(36).slice(2), title: '', chooseMin: '1', chooseMax: '1', items: {} });
const EMPTY_SET = { name: '', description: '', mealType: 'ANY', pricePerPerson: '', minGuests: '', maxGuests: '', active: true, sections: [] };

function SetMenuList({ menus, items, catalog, providerId, onNeedDishes }) {
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const del = useMenuMutation((id) => api.me.deleteSetMenu(id), providerId);

  const edit = (m) => setEditing({
    ...EMPTY_SET, ...m, description: m.description || '', pricePerPerson: String(m.pricePerPerson),
    minGuests: m.minGuests ?? '', maxGuests: m.maxGuests ?? '',
    sections: m.sections.map((s) => ({
      key: s.id, title: s.title, chooseMin: String(s.chooseMin), chooseMax: String(s.chooseMax),
      items: Object.fromEntries(s.items.map((i) => [i.itemId, String(Number(i.extraPricePerPerson) || '')])),
    })),
  });

  if (!items.length) {
    return (
      <EmptyState icon={UtensilsCrossed} title="Add dishes first" action={<Button variant="outline" onClick={onNeedDishes}>Go to dishes</Button>}>
        Set menus are built from your dishes, e.g. “Wedding lunch: pick 2 starters, 3 mains and 1 dessert”.
      </EmptyState>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {menus.length === 0 && <p className="t-small text-muted">A set menu has one price per person and lets customers pick dishes in each section.</p>}
      {menus.map((m) => (
        <div key={m.id} className={cx('panel p-4 flex items-start gap-3', !m.active && 'opacity-70')}>
          <div className="min-w-0 flex-1">
            <p className="t-h4 break-words">{m.name}</p>
            <p className="t-small mt-0.5">{money(m.pricePerPerson)} per person · {catalog.menu.mealLabels[m.mealType]}
              {(m.minGuests || m.maxGuests) && <span className="text-muted"> · {m.minGuests || 1}–{m.maxGuests || 'any'} guests</span>}</p>
            <p className="t-caption mt-1 break-words">{m.sections.map((s) => `${s.title}: pick ${s.chooseMin === s.chooseMax ? s.chooseMax : `${s.chooseMin}–${s.chooseMax}`} of ${s.items.length}`).join(' · ')}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {!m.active && <Badge>Hidden</Badge>}
              {m.active && !m.orderable && <Badge tone="amber">Not orderable</Badge>}
            </div>
            {m.problem && <p className="t-caption !text-warning mt-1">{m.problem}</p>}
          </div>
          <button className="btn-icon" aria-label={`Edit ${m.name}`} onClick={() => edit(m)}><Pencil className="w-4 h-4" /></button>
          <button className="btn-icon text-danger" aria-label={`Remove ${m.name}`} onClick={() => setDeleting(m)}><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <Button variant="outline" icon={Plus} className="self-start" onClick={() => setEditing({ ...EMPTY_SET, sections: [newSection()] })}>Add a set menu</Button>
      {editing && <SetMenuDrawer value={editing} items={items} catalog={catalog} providerId={providerId} onClose={() => setEditing(null)} />}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Remove this set menu?"
        footer={<><Button variant="outline" onClick={() => setDeleting(null)}>Keep</Button>
          <Button variant="navy" loading={del.isPending} onClick={() => del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}>Remove</Button></>}>
        <p className="t-body text-muted">“{deleting?.name}” will no longer be offered. Existing bookings keep their menu.</p>
        <Alert className="mt-3">{del.error?.message}</Alert>
      </Modal>
    </div>
  );
}

function sectionProblem(s) {
  const n = Object.keys(s.items).length;
  const min = Number(s.chooseMin);
  const max = Number(s.chooseMax);
  if (!s.title.trim()) return 'Name this section.';
  if (!n) return 'Pick the dishes this section offers.';
  if (!(max >= 1) || !(min >= 0)) return 'Enter how many dishes customers choose.';
  if (min > max) return 'Minimum cannot be more than maximum.';
  if (max > n) return `Customers can choose up to ${max} but you offer ${n}.`;
  return null;
}

function SetMenuDrawer({ value, items, catalog, providerId, onClose }) {
  const [s, setS] = useState(value);
  const m = useMenuMutation((body) => (s.id ? api.me.updateSetMenu(s.id, body) : api.me.addSetMenu(body)), providerId);
  const fe = fieldErrors(m);
  const set = (k) => (e) => setS({ ...s, [k]: e?.target ? e.target.value : e });
  const setSection = (idx, patch) => setS({ ...s, sections: s.sections.map((x, i) => (i === idx ? { ...x, ...patch } : x)) });
  const problems = s.sections.map(sectionProblem);
  const valid = s.name.trim() && Number(s.pricePerPerson) >= 1 && s.sections.length > 0 && problems.every((p) => !p)
    && !(s.minGuests && s.maxGuests && Number(s.minGuests) > Number(s.maxGuests));
  const byCourse = catalog.menu.courses.map((c) => [c, items.filter((i) => i.course === c.code)]).filter(([, l]) => l.length);

  const save = () => m.mutate({
    name: s.name.trim(), description: s.description.trim() || null, mealType: s.mealType, pricePerPerson: Number(s.pricePerPerson),
    minGuests: s.minGuests === '' ? null : Number(s.minGuests), maxGuests: s.maxGuests === '' ? null : Number(s.maxGuests), active: s.active,
    sections: s.sections.map((x) => ({
      title: x.title.trim(), chooseMin: Number(x.chooseMin), chooseMax: Number(x.chooseMax),
      items: Object.entries(x.items).map(([itemId, extra]) => ({ itemId, extraPricePerPerson: Number(extra) || 0 })),
    })),
  }, { onSuccess: onClose });

  return (
    <Drawer open onClose={onClose} title={s.id ? 'Edit set menu' : 'New set menu'}
      footer={<Button className="w-full" loading={m.isPending} disabled={!valid} onClick={save}>Save set menu</Button>}>
      <div className="flex flex-col gap-4">
        <Field label="Menu name" value={s.name} onChange={set('name')} error={fe.name} maxLength={150} required placeholder="e.g. Andhra wedding lunch" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price per person (₹)" type="number" min="1" inputMode="decimal" value={s.pricePerPerson} onChange={set('pricePerPerson')} error={fe.pricePerPerson} required />
          <Field as="select" label="Meal" value={s.mealType} onChange={set('mealType')}>
            {catalog.menu.mealTypes.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
          </Field>
          <Field label="Min guests" type="number" min="1" value={s.minGuests} onChange={set('minGuests')} />
          <Field label="Max guests" type="number" min="1" value={s.maxGuests} onChange={set('maxGuests')}
            error={s.minGuests && s.maxGuests && Number(s.minGuests) > Number(s.maxGuests) ? 'Must be at least the minimum' : undefined} />
        </div>
        <Field as="textarea" rows={2} label="Description" value={s.description} onChange={set('description')} maxLength={1000} />

        <h3 className="t-h4 mt-2">Sections</h3>
        {s.sections.map((sec, idx) => (
          <div key={sec.key} className="panel p-3 flex flex-col gap-3">
            <div className="flex gap-2 items-end">
              <Field className="flex-1" label={`Section ${idx + 1}`} value={sec.title} onChange={(e) => setSection(idx, { title: e.target.value })} placeholder="e.g. Starters" maxLength={100} />
              {s.sections.length > 1 && <button className="btn-icon text-danger" aria-label="Remove section" onClick={() => setS({ ...s, sections: s.sections.filter((_, i) => i !== idx) })}><Trash2 className="w-4 h-4" /></button>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Customer picks at least" type="number" min="0" value={sec.chooseMin} onChange={(e) => setSection(idx, { chooseMin: e.target.value })} />
              <Field label="and at most" type="number" min="1" value={sec.chooseMax} onChange={(e) => setSection(idx, { chooseMax: e.target.value })} />
            </div>
            <div className="flex flex-col gap-3">
              {byCourse.map(([course, list]) => (
                <div key={course.code}>
                  <p className="t-caption mb-1">{course.label}</p>
                  <ul className="flex flex-col gap-1">
                    {list.map((it) => {
                      const on = it.id in sec.items;
                      return (
                        <li key={it.id} className="flex items-center gap-2 min-h-10">
                          <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                            <input type="checkbox" className="w-[18px] h-[18px] accent-brand shrink-0" checked={on}
                              onChange={() => {
                                const next = { ...sec.items };
                                if (on) delete next[it.id]; else next[it.id] = '';
                                setSection(idx, { items: next });
                              }} />
                            <DietMark diet={it.diet} />
                            <span className={cx('t-small break-words min-w-0', !it.available && 'text-muted')}>{it.name}{!it.available && ' (unavailable)'}</span>
                          </label>
                          {on && (
                            <input type="number" min="0" inputMode="decimal" aria-label={`Extra per person for ${it.name}`} placeholder="+₹0"
                              className="field-input !w-24 !h-9 shrink-0" value={sec.items[it.id]}
                              onChange={(e) => setSection(idx, { items: { ...sec.items, [it.id]: e.target.value } })} />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <p className="t-caption">Optional: enter an extra per-person charge next to premium dishes.</p>
            {problems[idx] && <p className="t-caption !text-danger">{problems[idx]}</p>}
          </div>
        ))}
        <Button variant="ghost" icon={Plus} className="self-start" onClick={() => setS({ ...s, sections: [...s.sections, newSection()] })}>Add section</Button>
        <Checkbox label="Offer this menu to customers" checked={!!s.active} onChange={set('active')} />
        <Alert>{generalError(m)}</Alert>
      </div>
    </Drawer>
  );
}
