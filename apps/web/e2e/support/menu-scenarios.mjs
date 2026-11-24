// API scenarios for provider menus and menu pricing, against a running backend + fake Clerk
// (setup in e2e/README.md). Run: node e2e/support/menu-scenarios.mjs
import { API, call, customer, publishedProvider, token } from './api.js';

let passed = 0;
const failures = [];
const ok = (name, cond, extra) => {
  if (cond) passed++;
  else failures.push(`${name}${extra !== undefined ? ` — ${JSON.stringify(extra)}` : ''}`);
};
async function expectStatus(name, status, fn) {
  try {
    await fn();
    failures.push(`${name} — expected ${status}, call succeeded`);
  } catch (e) {
    const got = Number(/-> (\d{3})/.exec(e.message)?.[1]);
    ok(name, got === status, e.message.slice(0, 220));
  }
}

async function waitForApi() {
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(`${API}/catalog`)).ok) return; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('API did not start');
}

const run = Date.now().toString(36);
const future = (() => { const d = new Date(); d.setDate(d.getDate() + 20); return d.toISOString().slice(0, 10); })();

await waitForApi();

const catalog = await call('GET', '/catalog');
ok('catalog exposes menu options', catalog.menu?.courses?.length === 10 && catalog.menu.allergens.length === 10, catalog.menu);

const caterer = await publishedProvider(`cat_${run}`, {
  name: `Annapurna Caterers ${run}`, city: 'Hyderabad', categories: ['CATERER'], cuisines: ['ANDHRA'],
  services: [{ category: 'CATERER', title: 'Wedding catering', deliveryMode: 'VENUE_BANQUET', pricingModel: 'PER_PLATE', price: 300, minGuests: 50, maxGuests: 1000 }],
});
const chef = await publishedProvider(`chef_${run}`, {
  name: `Chef Ravi ${run}`, city: 'Hyderabad', categories: ['HOME_CHEF'], cuisines: ['ANDHRA'],
  services: [
    { category: 'HOME_CHEF', title: 'Dinner at your home', deliveryMode: 'CHEF_VISITS_HOME', pricingModel: 'PER_HOUR', price: 800 },
    { category: 'HOME_CHEF', title: 'Custom party', deliveryMode: 'CHEF_VISITS_HOME', pricingModel: 'CUSTOM_QUOTE' },
  ],
});
const photo = await publishedProvider(`ph_${run}`, {
  name: `Lens ${run}`, city: 'Hyderabad', categories: ['PHOTOGRAPHER'],
  services: [{ category: 'PHOTOGRAPHER', title: 'Event photos', deliveryMode: 'ON_SITE', pricingModel: 'PER_EVENT', price: 15000 }],
});
const cust = await customer(`cust_${run}`, 'Meera');

// ---------------------------------------------------------------- dishes
const dish = (name, extra = {}) => ({ name, course: 'MAIN_COURSE', diet: 'VEG', pricePerPerson: 100, ...extra });
let m = await call('POST', '/providers/me/menu/items', caterer.token, dish('Paneer tikka', { course: 'STARTER', pricePerPerson: 120, allergens: ['DAIRY'] }));
m = await call('POST', '/providers/me/menu/items', caterer.token, dish('Chicken 65', { course: 'STARTER', diet: 'NON_VEG', pricePerPerson: 150, spiceLevel: 'HOT' }));
m = await call('POST', '/providers/me/menu/items', caterer.token, dish('Veg biryani', { course: 'RICE', pricePerPerson: 140 }));
m = await call('POST', '/providers/me/menu/items', caterer.token, dish('Gongura mutton', { diet: 'NON_VEG', pricePerPerson: 220, minServings: 100 }));
m = await call('POST', '/providers/me/menu/items', caterer.token, dish('Double ka meetha', { course: 'DESSERT', pricePerPerson: 60, allergens: ['DAIRY', 'NUTS'] }));
ok('5 dishes saved', m.items.length === 5, m.items.length);
ok('dishes ordered by course (starters first)', m.items[0].course === 'STARTER' && m.items.at(-1).course === 'DESSERT', m.items.map((i) => i.course));
const id = (name) => m.items.find((i) => i.name === name).id;

await expectStatus('duplicate dish name is rejected (case-insensitive)', 409, () => call('POST', '/providers/me/menu/items', caterer.token, dish('paneer TIKKA')));
await expectStatus('unknown allergen is rejected', 422, () => call('POST', '/providers/me/menu/items', caterer.token, dish('X', { allergens: ['PLASTIC'] })));
await expectStatus('negative price is rejected with a field error', 400, () => call('POST', '/providers/me/menu/items', caterer.token, dish('Y', { pricePerPerson: -1 })));
await expectStatus('another provider cannot edit the dish', 404, () => call('PUT', `/providers/me/menu/items/${id('Veg biryani')}`, chef.token, dish('Hijack')));
await expectStatus('customers cannot use the provider menu API', 403, () => call('GET', '/providers/me/menu', cust));

// ---------------------------------------------------------------- set menu
const setMenu = (sections, extra = {}) => ({ name: 'Wedding lunch', mealType: 'LUNCH', pricePerPerson: 350, minGuests: 50, sections, ...extra });
await expectStatus('section asking for more choices than dishes is rejected', 422, () => call('POST', '/providers/me/menu/sets', caterer.token,
  setMenu([{ title: 'Starters', chooseMin: 3, chooseMax: 3, items: [{ itemId: id('Paneer tikka') }] }])));
await expectStatus('set menu with another provider’s dish is rejected', 422, async () => {
  const theirs = await call('POST', '/providers/me/menu/items', chef.token, dish('Chef special'));
  return call('POST', '/providers/me/menu/sets', caterer.token, setMenu([{ title: 'S', chooseMin: 1, chooseMax: 1, items: [{ itemId: theirs.items[0].id }] }]));
});
m = await call('POST', '/providers/me/menu/sets', caterer.token, setMenu([
  { title: 'Starters', chooseMin: 1, chooseMax: 2, items: [{ itemId: id('Paneer tikka') }, { itemId: id('Chicken 65'), extraPricePerPerson: 40 }] },
  { title: 'Rice', chooseMin: 1, chooseMax: 1, items: [{ itemId: id('Veg biryani') }] },
  { title: 'Dessert', chooseMin: 1, chooseMax: 1, items: [{ itemId: id('Double ka meetha') }] },
]));
const lunch = m.menus[0];
ok('set menu saved and orderable', lunch && lunch.orderable === true && lunch.sections.length === 3, lunch);
const sec = (title) => lunch.sections.find((s) => s.title === title).id;

let pub = await call('GET', `/providers/${caterer.id}/menu`);
ok('public menu lists dishes and the set menu', pub.items.length === 5 && pub.menus.length === 1, { items: pub.items.length, menus: pub.menus.length });

// ---------------------------------------------------------------- estimates
const svc = caterer.services[0].id;
const full = { menuId: lunch.id, choices: [
  { sectionId: sec('Starters'), itemId: id('Paneer tikka') }, { sectionId: sec('Starters'), itemId: id('Chicken 65') },
  { sectionId: sec('Rice'), itemId: id('Veg biryani') }, { sectionId: sec('Dessert'), itemId: id('Double ka meetha') }] };
let e = await call('POST', `/providers/${caterer.id}/estimate`, null, { serviceId: svc, guests: 200, menu: full });
ok('per-plate service: set menu replaces the plate rate (200 × (350+40))', e.mode === 'MENU_REPLACES_SERVICE' && Number(e.total) === 78000 && Number(e.menuPerPerson) === 390, e);
e = await call('POST', `/providers/${caterer.id}/estimate`, null, { serviceId: svc, guests: 200 });
ok('no menu: plain plate rate (200 × 300)', e.mode === 'SERVICE_ONLY' && Number(e.total) === 60000, e);
await expectStatus('incomplete set menu choice is rejected', 422, () => call('POST', `/providers/${caterer.id}/estimate`, null,
  { serviceId: svc, guests: 200, menu: { menuId: lunch.id, choices: [{ sectionId: sec('Rice'), itemId: id('Veg biryani') }] } }));
await expectStatus('too many choices in a section is rejected', 422, () => call('POST', `/providers/${caterer.id}/estimate`, null,
  { serviceId: svc, guests: 200, menu: { ...full, choices: [...full.choices, { sectionId: sec('Rice'), itemId: id('Paneer tikka') }] } }));
await expectStatus('choosing a dish from the wrong section is rejected', 422, () => call('POST', `/providers/${caterer.id}/estimate`, null,
  { serviceId: svc, guests: 200, menu: { menuId: lunch.id, choices: [
    { sectionId: sec('Starters'), itemId: id('Veg biryani') }, { sectionId: sec('Rice'), itemId: id('Veg biryani') }, { sectionId: sec('Dessert'), itemId: id('Double ka meetha') }] } }));
e = await call('POST', `/providers/${caterer.id}/estimate`, null, { serviceId: svc, guests: 120, menu: { items: [id('Gongura mutton'), id('Veg biryani')] } });
ok('build-your-own: sum of dish prices × guests (120 × 360)', e.mode === 'MENU_REPLACES_SERVICE' && Number(e.total) === 43200, e);
await expectStatus('dish minimum guests is enforced', 422, () => call('POST', `/providers/${caterer.id}/estimate`, null,
  { serviceId: svc, guests: 60, menu: { items: [id('Gongura mutton')] } }));
await expectStatus('set menu and own dishes together are rejected', 422, () => call('POST', `/providers/${caterer.id}/estimate`, null,
  { serviceId: svc, guests: 100, menu: { ...full, items: [id('Veg biryani')] } }));

// chef: hourly service + food cost
let cm = await call('POST', '/providers/me/menu/items', chef.token, dish('Pesarattu', { course: 'STARTER', pricePerPerson: 90 }));
const pesarattu = cm.items.find((i) => i.name === 'Pesarattu').id;
const chefMenuIds = cm.items.map((i) => i.id);
e = await call('POST', `/providers/${chef.id}/estimate`, null, { serviceId: chef.services.find((s) => s.pricingModel === 'PER_HOUR').id, guests: 12, hours: 4, menu: { items: chefMenuIds } });
ok('hourly chef: service charge + food (4×800 + 12×(100+90))', e.mode === 'SERVICE_PLUS_MENU' && Number(e.serviceCharge) === 3200 && Number(e.foodCost) === 2280 && Number(e.total) === 5480, e);
e = await call('POST', `/providers/${chef.id}/estimate`, null, { serviceId: chef.services.find((s) => s.pricingModel === 'CUSTOM_QUOTE').id, guests: 10, menu: { items: [pesarattu] } });
ok('custom-quote service: no total, food cost as guide', e.mode === 'QUOTE_WITH_MENU' && e.total === null && Number(e.foodCost) === 900, e);
await expectStatus('menus cannot be attached to a non-food service', 422, () => call('POST', `/providers/${photo.id}/estimate`, null,
  { serviceId: photo.services[0].id, guests: 10, menu: { items: [pesarattu] } }));
await expectStatus('another provider’s dish cannot be priced', 422, () => call('POST', `/providers/${caterer.id}/estimate`, null,
  { serviceId: svc, guests: 100, menu: { items: [pesarattu] } }));

// ---------------------------------------------------------------- booking with a menu
const booking = await call('POST', '/bookings', cust, {
  providerId: caterer.id, serviceId: svc, eventDate: future, eventTime: '12:30', eventAddress: '12 Road No 3, Banjara Hills',
  eventCity: 'Hyderabad', guestCount: 200, menu: full,
});
ok('booking estimate equals the preview', Number(booking.estimatedTotal) === 78000 && booking.menuPricing === 'MENU_REPLACES_SERVICE', booking);
ok('booking stores menu snapshot lines', booking.menuLines.length === 5 && booking.menuLines[0].type === 'SET_MENU', booking.menuLines);

// Provider changes prices afterwards: the booking must not change.
await call('PUT', `/providers/me/menu/sets/${lunch.id}`, caterer.token, setMenu(lunch.sections.map((s) => ({
  title: s.title, chooseMin: s.chooseMin, chooseMax: s.chooseMax, items: s.items.map((i) => ({ itemId: i.itemId, extraPricePerPerson: i.extraPricePerPerson })) })), { pricePerPerson: 500 }));
const again = await call('GET', `/bookings/${booking.id}`, cust);
ok('later price changes do not alter an existing booking', Number(again.estimatedTotal) === 78000 && Number(again.menuLines[0].unitPricePerPerson) === 350, again.menuLines[0]);
const provView = await call('GET', `/bookings/${booking.id}`, caterer.token);
ok('provider sees the menu on the request', provView.menuLines.length === 5, provView.menuLines.length);

// Section items were replaced by the edit, so choices made with old section ids must be refused cleanly.
await expectStatus('stale section ids after an edit are refused', 422, () => call('POST', `/providers/${caterer.id}/estimate`, null, { serviceId: svc, guests: 200, menu: full }));

// ---------------------------------------------------------------- availability rules
await expectStatus('dish used in a set menu cannot be deleted', 409, () => call('DELETE', `/providers/me/menu/items/${id('Veg biryani')}`, caterer.token));
const biryani = m.items.find((i) => i.name === 'Veg biryani');
m = await call('PUT', `/providers/me/menu/items/${biryani.id}`, caterer.token, { ...dish('Veg biryani', { course: 'RICE', pricePerPerson: 140 }), available: false });
ok('owner sees set menu as not orderable when a required section runs out', m.menus[0].orderable === false && /Rice/.test(m.menus[0].problem), m.menus[0]);
pub = await call('GET', `/providers/${caterer.id}/menu`);
ok('customers no longer see the unavailable dish or the unorderable set menu', pub.items.length === 4 && pub.menus.length === 0, { items: pub.items.map((i) => i.name), menus: pub.menus.length });
m = await call('DELETE', `/providers/me/menu/items/${id('Gongura mutton')}`, caterer.token);
ok('unused dish can be deleted', m.items.length === 4, m.items.length);
m = await call('DELETE', `/providers/me/menu/sets/${lunch.id}`, caterer.token);
ok('set menu can be deleted', m.menus.length === 0, m.menus.length);
const afterDelete = await call('GET', `/bookings/${booking.id}`, cust);
ok('deleting the set menu keeps the booking snapshot', afterDelete.menuLines.length === 5, afterDelete.menuLines.length);

await expectStatus('unknown provider menu is 404', 404, () => call('GET', '/providers/00000000-0000-0000-0000-000000000000/menu'));
void token;

console.log(`\nMenu scenarios: ${passed} passed, ${failures.length} failed`);
failures.forEach((f) => console.log(`  ✗ ${f}`));
process.exit(failures.length ? 1 : 0);
