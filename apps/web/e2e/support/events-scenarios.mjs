// API scenarios for the customer event planner, against a running backend + fake Clerk (see e2e/README.md).
// Run: node e2e/support/events-scenarios.mjs
import { API, call, customer, publishedProvider } from './api.js';

let passed = 0;
const failures = [];
const ok = (name, cond, extra) => { if (cond) passed++; else failures.push(`${name}${extra !== undefined ? ` — ${JSON.stringify(extra).slice(0, 300)}` : ''}`); };
async function expectStatus(name, status, fn) {
  try { await fn(); failures.push(`${name} — expected ${status}, call succeeded`); } catch (e) {
    const got = Number(/-> (\d{3})/.exec(e.message)?.[1]);
    ok(name, got === status, e.message.slice(0, 220));
  }
}
for (let i = 0; i < 90; i++) {
  try { if ((await fetch(`${API}/catalog`)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 2000));
}

const run = Date.now().toString(36);
const days = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const custTok = await customer(`user_evcust${run}`, 'Meera');
const otherTok = await customer(`user_evother${run}`, 'Ravi');

// ---------------------------------------------------------------- events
const caterer = await publishedProvider(`user_evcat${run}`, {
  name: `Feast Caterers ${run}`, city: 'Hyderabad', categories: ['CATERER'], cuisines: ['ANDHRA'],
  services: [{ category: 'CATERER', title: 'Wedding buffet', deliveryMode: 'VENUE_BANQUET', pricingModel: 'PER_PLATE', price: 400, minGuests: 50 }],
});
const photo = await publishedProvider(`user_evph${run}`, {
  name: `Lens ${run}`, city: 'Hyderabad', categories: ['PHOTOGRAPHER'],
  services: [{ category: 'PHOTOGRAPHER', title: 'Full day coverage', deliveryMode: 'ON_SITE', pricingModel: 'PER_EVENT', price: 30000 }],
});
const decor = await publishedProvider(`user_evdec${run}`, {
  name: `Petals ${run}`, city: 'Hyderabad', categories: ['DECORATOR'],
  services: [{ category: 'DECORATOR', title: 'Stage decor', deliveryMode: 'ON_SITE', pricingModel: 'CUSTOM_QUOTE' }],
});

const ev = await call('POST', '/customer/events', custTok, {
  title: 'Priya & Arjun reception', eventType: 'WEDDING', eventDate: days(30), eventTime: '19:00', city: 'Hyderabad',
  venue: 'Sri Convention, Madhapur', guestCount: 300, budget: 200000,
});
ok('wedding starts with the suggested checklist', ev.needs.map((n) => n.category).join() === 'CATERER,WEDDING_PLANNER,DECORATOR,PHOTOGRAPHER,VIDEOGRAPHER,WAITER', ev.needs.map((n) => n.category));
ok('new event has an empty budget summary', Number(ev.budgetSummary.committed) === 0 && Number(ev.budgetSummary.remaining) === 200000, ev.budgetSummary);

const custom = await call('POST', '/customer/events', custTok, { title: 'Small dinner', eventType: 'DINNER_PARTY', eventDate: days(5), city: 'Hyderabad', guestCount: 10, needs: ['PERSONAL_CHEF'] });
ok('custom checklist replaces suggestions', custom.needs.length === 1 && custom.needs[0].category === 'PERSONAL_CHEF');
await expectStatus('past dates are refused', 422, () => call('POST', '/customer/events', custTok, { title: 'x', eventType: 'OTHER', eventDate: days(-2), city: 'H', guestCount: 5 }));
await expectStatus('unknown event type is refused', 422, () => call('POST', '/customer/events', custTok, { title: 'x', eventType: 'RAVE', eventDate: days(3), city: 'H', guestCount: 5 }));
await expectStatus('another customer cannot open the event', 404, () => call('GET', `/customer/events/${ev.id}`, otherTok));
await expectStatus('providers cannot use the event planner', 403, () => call('GET', '/customer/events', caterer.token));

// Book the caterer and the photographer for the event; request a quote from the decorator
const book = (prov, guests, extra = {}) => call('POST', '/bookings', custTok, {
  providerId: prov.id, serviceId: prov.services[0].id, eventDate: days(30), eventTime: '18:00', eventAddress: 'Sri Convention, Madhapur',
  eventCity: 'Hyderabad', guestCount: guests, eventId: ev.id, ...extra });
const bCat = await book(caterer, 300);
ok('booking carries the event', bCat.eventId === ev.id && bCat.eventTitle === 'Priya & Arjun reception', { eventId: bCat.eventId, title: bCat.eventTitle });
await book(photo, 300);
const bDecor = await book(decor, 300);
await expectStatus('cannot book into someone else’s event', 404, () => call('POST', '/bookings', otherTok, {
  providerId: photo.id, serviceId: photo.services[0].id, eventDate: days(31), eventTime: '18:00', eventAddress: 'x', eventCity: 'Hyderabad', guestCount: 10, eventId: ev.id }));

let e = await call('GET', `/customer/events/${ev.id}`, custTok);
const need = (cat) => e.needs.find((n) => n.category === cat);
ok('requested services show REQUESTED', need('CATERER').state === 'REQUESTED' && need('PHOTOGRAPHER').state === 'REQUESTED' && need('DECORATOR').state === 'REQUESTED');
ok('pending total = 300×400 + 30000', Number(e.budgetSummary.pending) === 150000 && Number(e.budgetSummary.awaitingPrice) === 1, e.budgetSummary);

// Providers respond
await call('POST', `/bookings/${bCat.id}/accept`, caterer.token, {});
await call('POST', `/bookings/${bDecor.id}/quotation`, decor.token, { items: [{ description: 'Stage + entrance', unitPrice: 60000, quantity: 1 }] });
e = await call('GET', `/customer/events/${ev.id}`, custTok);
ok('accepted catering is BOOKED', need('CATERER').state === 'BOOKED');
ok('budget: committed 120000, pending 30000 + 60000, remaining -10000',
  Number(e.budgetSummary.committed) === 120000 && Number(e.budgetSummary.pending) === 90000 && Number(e.budgetSummary.remaining) === -10000, e.budgetSummary);
const list2 = await call('GET', '/customer/events', custTok);
ok('event list shows progress', list2.find((x) => x.id === ev.id)?.needsBooked === 1, list2.find((x) => x.id === ev.id));

// Checklist editing
e = await call('PUT', `/customer/events/${ev.id}/needs/${need('CATERER').id}`, custTok, { category: 'CATERER', budgetAllocation: 125000 });
ok('allocation saved and summed', Number(need('CATERER').budgetAllocation) === 125000 && Number(e.budgetSummary.allocated) === 125000);
e = await call('POST', `/customer/events/${ev.id}/needs`, custTok, { category: 'BARTENDER' });
ok('service added to checklist', !!need('BARTENDER'));
await expectStatus('duplicate checklist service is refused', 409, () => call('POST', `/customer/events/${ev.id}/needs`, custTok, { category: 'BARTENDER' }));
e = await call('DELETE', `/customer/events/${ev.id}/needs/${need('BARTENDER').id}`, custTok);
ok('service removed from checklist', !need('BARTENDER'));

// Attach/detach an existing booking made without the event
const loose = await call('POST', '/bookings', custTok, { providerId: photo.id, serviceId: photo.services[0].id, eventDate: days(29), eventTime: '10:00',
  eventAddress: 'Home', eventCity: 'Hyderabad', guestCount: 20 });
e = await call('PUT', `/customer/events/${ev.id}/bookings/${loose.id}`, custTok);
ok('existing booking attached', need('PHOTOGRAPHER').bookings.length === 2);
await expectStatus('cannot attach someone else’s booking', 404, () => call('PUT', `/customer/events/${ev.id}/bookings/${bCat.id}`, otherTok));
e = await call('DELETE', `/customer/events/${ev.id}/bookings/${loose.id}`, custTok);
ok('booking detached', need('PHOTOGRAPHER').bookings.length === 1);

// Status and deletion rules
await expectStatus('event with active bookings cannot be deleted', 409, () => call('DELETE', `/customer/events/${ev.id}`, custTok));
e = await call('POST', `/customer/events/${ev.id}/status`, custTok, { status: 'CANCELLED' });
ok('event can be cancelled', e.status === 'CANCELLED');
await expectStatus('cannot add bookings to a cancelled event', 409, () => book(photo, 50));
await call('DELETE', `/customer/events/${custom.id}`, custTok);
await expectStatus('empty event deleted', 404, () => call('GET', `/customer/events/${custom.id}`, custTok));

const cat = await call('GET', '/catalog');
ok('catalog lists event types', cat.eventTypes.length === 9 && cat.eventTypes[0].suggested.length > 0);

console.log(`\nEvent planner scenarios: ${passed} passed, ${failures.length} failed`);
failures.forEach((f) => console.log(`  ✗ ${f}`));
process.exit(failures.length ? 1 : 0);
