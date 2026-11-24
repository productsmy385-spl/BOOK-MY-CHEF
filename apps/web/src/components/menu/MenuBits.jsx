import { useMemo, useState } from 'react';
import { Check, Info, UtensilsCrossed } from 'lucide-react';
import { money } from '../../lib/format';
import { Alert, Badge, cx } from '../ui';
import { EMPTY_PICK } from './menuSelection';

/** Indian food-label style mark: green for veg/vegan, amber for egg, red for non-veg. */
export function DietMark({ diet, className }) {
  const color = { VEG: '#15803D', VEGAN: '#15803D', EGG: '#B45309', NON_VEG: '#B91C1C' }[diet] || '#6B7280';
  const label = { VEG: 'Vegetarian', VEGAN: 'Vegan', EGG: 'Contains egg', NON_VEG: 'Non-vegetarian' }[diet] || diet;
  return (
    <span role="img" aria-label={label} title={label}
      className={cx('inline-flex items-center justify-center w-3.5 h-3.5 border-[1.5px] rounded-[2px] shrink-0', className)}
      style={{ borderColor: color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
    </span>
  );
}

function Tile({ selected, disabled, onClick, item, price, catalog }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected}
      className={cx('relative text-left rounded-md border p-2.5 flex flex-col gap-2 transition-colors min-w-0',
        selected ? 'border-brand bg-pale' : 'border-line bg-white hover:border-sky',
        disabled && !selected && 'opacity-50 cursor-not-allowed')}>
      {selected && <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>}
      {item.imageUrl
        ? <img src={item.imageUrl} alt="" loading="lazy" className="w-full aspect-[4/3] object-cover rounded-sm bg-canvas" />
        : <span className="w-full aspect-[4/3] rounded-sm bg-canvas flex items-center justify-center text-muted"><UtensilsCrossed className="w-6 h-6" /></span>}
      <span className="flex items-start gap-1.5 min-w-0">
        <DietMark diet={item.diet} className="mt-0.5" />
        <span className="t-small font-medium break-words min-w-0">{item.name}</span>
      </span>
      {price && <span className="t-caption">{price}</span>}
      {item.spiceLevel === 'HOT' && <span className="t-caption">{catalog?.menu.spiceLabels.HOT}</span>}
    </button>
  );
}

/**
 * Customer's menu selection for a booking: a set menu with "pick N" sections,
 * their own dishes, or no menu (they describe it in words).
 */
export function MenuPicker({ menu, value, onChange, guests, catalog }) {
  const [vegOnly, setVegOnly] = useState(false);
  const hasSets = menu.menus.length > 0;
  const hasDishes = menu.items.length > 0;
  const selectedMenu = menu.menus.find((m) => m.id === value.menuId);

  const dishesByCourse = useMemo(() => {
    const groups = new Map();
    menu.items.filter((i) => !vegOnly || i.diet === 'VEG' || i.diet === 'VEGAN').forEach((i) => {
      if (!groups.has(i.course)) groups.set(i.course, []);
      groups.get(i.course).push(i);
    });
    return [...groups.entries()];
  }, [menu.items, vegOnly]);

  const customPerPerson = value.items.reduce((s, id) => s + Number(menu.items.find((i) => i.id === id)?.pricePerPerson || 0), 0);
  const g = Number(guests) || 0;

  const toggleChoice = (section, itemId) => {
    const picked = value.choices[section.id] || [];
    let next;
    if (picked.includes(itemId)) next = picked.filter((x) => x !== itemId);
    else if (picked.length < section.chooseMax) next = [...picked, itemId];
    else if (section.chooseMax === 1) next = [itemId];
    else return;
    onChange({ ...value, choices: { ...value.choices, [section.id]: next } });
  };
  const toggleDish = (id) => onChange({ ...value, items: value.items.includes(id) ? value.items.filter((x) => x !== id) : [...value.items, id] });

  const modes = [
    hasSets && { v: 'set', title: 'Set menus', text: 'Fixed price per person; you pick dishes in each course.' },
    hasDishes && { v: 'custom', title: 'Build your own', text: 'Choose any dishes; priced per person.' },
    { v: 'none', title: 'I’ll describe it', text: 'Write what you have in mind; the provider confirms the price.' },
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Menu">
        {modes.map((m) => (
          <label key={m.v} className={cx('panel p-3 cursor-pointer flex gap-2.5 items-start', value.mode === m.v && 'border-brand bg-pale')}>
            <input type="radio" name="menu-mode" className="mt-1 accent-brand" checked={value.mode === m.v}
              onChange={() => onChange({ ...EMPTY_PICK, mode: m.v })} />
            <span className="min-w-0"><span className="t-h4 block">{m.title}</span><span className="t-caption block">{m.text}</span></span>
          </label>
        ))}
      </div>

      {value.mode === 'set' && (
        <div className="flex flex-col gap-3">
          {menu.menus.map((m) => {
            const outOfRange = g > 0 && ((m.minGuests && g < m.minGuests) || (m.maxGuests && g > m.maxGuests));
            return (
              <label key={m.id} className={cx('panel p-4 cursor-pointer flex gap-3 items-start', value.menuId === m.id && 'border-brand bg-pale')}>
                <input type="radio" name="set-menu" className="mt-1 accent-brand" checked={value.menuId === m.id}
                  onChange={() => onChange({ ...value, menuId: m.id, choices: {} })} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="t-h4 break-words">{m.name}</span>
                    <span className="t-small font-semibold whitespace-nowrap">{money(m.pricePerPerson)} per person</span>
                  </span>
                  <span className="t-caption block mt-0.5">
                    {catalog.menu.mealLabels[m.mealType]}
                    {(m.minGuests || m.maxGuests) && ` · ${m.minGuests || 1}–${m.maxGuests || 'any'} guests`}
                    {' · '}{m.sections.map((s) => s.title).join(', ')}
                  </span>
                  {m.description && <span className="t-small text-muted block mt-1 break-words">{m.description}</span>}
                  {outOfRange && <span className="t-caption !text-danger block mt-1">Not available for {g} guests.</span>}
                </span>
              </label>
            );
          })}

          {selectedMenu && selectedMenu.sections.map((s) => {
            const picked = value.choices[s.id] || [];
            const need = s.chooseMin === s.chooseMax ? `Choose ${s.chooseMax}` : `Choose ${s.chooseMin}–${s.chooseMax}`;
            return (
              <fieldset key={s.id} className="flex flex-col gap-2">
                <legend className="flex items-center justify-between gap-3 w-full mb-2">
                  <span className="t-h4">{s.title} <span className="t-caption font-normal">· {need}</span></span>
                  <Badge tone={picked.length >= s.chooseMin ? 'green' : 'neutral'}>{picked.length}/{s.chooseMax}</Badge>
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {s.items.map((it) => (
                    <Tile key={it.itemId} item={it} catalog={catalog} selected={picked.includes(it.itemId)}
                      disabled={!picked.includes(it.itemId) && picked.length >= s.chooseMax && s.chooseMax > 1}
                      price={Number(it.extraPricePerPerson) > 0 ? `+${money(it.extraPricePerPerson)} per person` : null}
                      onClick={() => toggleChoice(s, it.itemId)} />
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
      )}

      {value.mode === 'custom' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="t-small">{value.items.length} dish{value.items.length === 1 ? '' : 'es'} · <strong>{money(customPerPerson)}</strong> per person</p>
            <button type="button" aria-pressed={vegOnly} onClick={() => setVegOnly((v) => !v)} className={cx('chip', vegOnly && 'chip-active')}>
              <DietMark diet="VEG" /> Veg only
            </button>
          </div>
          {dishesByCourse.length === 0 && <p className="t-small text-muted">No vegetarian dishes on this menu.</p>}
          {dishesByCourse.map(([course, items]) => (
            <section key={course}>
              <h4 className="t-label mb-2">{catalog.menu.courseLabels[course] || course}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((it) => (
                  <Tile key={it.id} item={it} catalog={catalog} selected={value.items.includes(it.id)}
                    price={`${money(it.pricePerPerson)} per person${it.minServings ? ` · min ${it.minServings}` : ''}`}
                    onClick={() => toggleDish(it.id)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong, muted }) {
  return (
    <div className={cx('flex items-start justify-between gap-3 py-1.5', strong && 'font-semibold', muted && 'text-muted')}>
      <span className="min-w-0 break-words">{label}</span>
      <span className="whitespace-nowrap">{value}</span>
    </div>
  );
}

/** Price breakdown returned by POST /providers/{id}/estimate. */
export function PriceBreakdown({ est, pending, error, missing, catalog }) {
  if (missing?.length) {
    return <p className="t-small text-muted flex gap-1.5"><Info className="w-4 h-4 shrink-0 mt-0.5" />Still to choose: {missing.join(', ')}.</p>;
  }
  if (error) return <Alert tone="warning">{error}</Alert>;
  if (!est) return <p className="t-small text-muted">{pending ? 'Calculating…' : 'Enter the number of guests to see the price.'}</p>;
  const unit = catalog.pricingLabels[est.pricingModel] || '';
  const food = est.foodCost != null && `Food: ${est.guests} guests × ${money(est.menuPerPerson)}`;
  return (
    <div className={cx('t-small divide-y divide-line', pending && 'opacity-60')}>
      {est.mode === 'SERVICE_PLUS_MENU' && <Row label={`Service (${money(est.servicePrice)} ${unit})`} value={money(est.serviceCharge)} />}
      {food && <Row label={est.mode === 'QUOTE_WITH_MENU' ? `${food} (guide)` : food} value={money(est.foodCost)} />}
      {est.mode === 'MENU_REPLACES_SERVICE' && <Row muted label={`The menu price replaces the service’s ${unit} rate.`} value="" />}
      <Row strong
        label={est.total == null ? 'Total' : est.mode === 'SERVICE_ONLY' ? `Estimated total (${money(est.servicePrice)} ${unit})` : 'Estimated total'}
        value={est.total != null ? money(est.total) : 'On request'} />
    </div>
  );
}

/** Menu a booking was made with (snapshot lines from the API). */
export function BookingMenu({ booking, catalog }) {
  const lines = booking.menuLines || [];
  if (!lines.length) return null;
  const setLine = lines.find((l) => l.type === 'SET_MENU');
  const dishes = lines.filter((l) => l.type !== 'SET_MENU');
  const perPerson = lines.reduce((s, l) => s + Number(l.unitPricePerPerson), 0);
  return (
    <section className="panel p-4 mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 className="t-h4">{setLine ? setLine.name : 'Custom menu'}</h2>
        <p className="t-small font-semibold">{money(perPerson)} per person × {booking.guests}</p>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 t-small">
        {dishes.map((d, i) => (
          <li key={i} className="flex items-start justify-between gap-3">
            <span className="flex items-start gap-2 min-w-0">
              <DietMark diet={d.diet} className="mt-0.5" />
              <span className="break-words min-w-0">{d.name}<span className="t-caption"> · {d.sectionTitle || catalog.menu.courseLabels[d.course] || ''}</span></span>
            </span>
            {Number(d.unitPricePerPerson) > 0 && <span className="whitespace-nowrap text-muted">{setLine ? '+' : ''}{money(d.unitPricePerPerson)}</span>}
          </li>
        ))}
      </ul>
      <div className="mt-3 pt-2 border-t border-line t-small">
        {booking.serviceCharge != null && booking.foodCost != null && <Row label="Service charge" value={money(booking.serviceCharge)} />}
        {booking.foodCost != null && <Row label={booking.menuPricing === 'QUOTE_WITH_MENU' ? 'Food (guide for quotation)' : 'Food'} value={money(booking.foodCost)} />}
      </div>
    </section>
  );
}
