// End-to-end API verification against a running backend + fake-clerk.mjs
const API = process.env.API || 'http://localhost:8081/api/v1';
const CLERK = 'http://localhost:9999';
const run = Date.now().toString(36);
let pass = 0, fail = 0;
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name} ${extra}`); }
};
const token = async (sub, q = '') => (await (await fetch(`${CLERK}/token?sub=${sub}${q}`)).json()).token;
async function call(method, path, tok, body) {
  const res = await fetch(API + path, {
    method, headers: { 'content-type': 'application/json', ...(tok ? { authorization: `Bearer ${tok}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null; try { json = await res.json(); } catch { }
  return { status: res.status, body: json, data: json?.data };
}
const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

console.log('\n# Auth & access control');
check('public catalog', (await call('GET', '/catalog')).status === 200);
check('no token -> bookings 401', (await call('GET', '/bookings')).status === 401);
check('garbage token -> 401', (await call('GET', '/auth/me', 'abc.def.ghi')).status === 401);
const wrongIss = await token(`user_x${run}`, '&iss=https://evil.example');
check('token from wrong issuer -> 401', (await call('GET', '/auth/me', wrongIss)).status === 401);
const expired = await token(`user_x${run}`, '&ttl=-120');
check('expired token -> 401', (await call('GET', '/auth/me', expired)).status === 401);
const forged = (await token(`user_x${run}`)).replace(/\.[^.]+$/, '.AAAA');
check('bad signature -> 401', (await call('GET', '/auth/me', forged)).status === 401);
check('X-Mock-User-Id no longer honoured', (await fetch(API + '/bookings', { headers: { 'X-Mock-User-Id': 'clerk_cust_ananya_01' } })).status === 401);
check('unsigned Clerk webhook -> 401', (await call('POST', '/auth/webhook', null, { type: 'user.deleted', data: { id: 'x' } })).status !== 200);

const P1 = await token(`user_p1${run}`), P2 = await token(`user_p2${run}`);
const C1 = await token(`user_c1${run}`), C2 = await token(`user_c2${run}`), C3 = await token(`user_c3${run}`);
check('unsynced token cannot use bookings', (await call('GET', '/bookings', C1)).status === 403);
let r = await call('POST', '/auth/sync', P1, { intendedRole: 'PROVIDER', fullName: `Lakshmi ${run}`, city: 'Hyderabad', roles: ['HOME_CHEF', 'CATERER'] });
check('provider sync', r.status === 200 && r.data.userType === 'PROVIDER' && r.data.providerOnboardingStatus === 'DRAFT', JSON.stringify(r.body));
check('provider not auto-verified', r.data?.providerVerificationStatus === 'PENDING');
await call('POST', '/auth/sync', P2, { intendedRole: 'PROVIDER', fullName: 'Ravi Lens', city: 'Hyderabad', roles: ['PHOTOGRAPHER'] });
r = await call('POST', '/auth/sync', C1, { intendedRole: 'CUSTOMER', fullName: 'Asha Customer', city: 'Hyderabad' });
check('customer sync', r.status === 200 && r.data.userType === 'CUSTOMER');
await call('POST', '/auth/sync', C2, { intendedRole: 'CUSTOMER', fullName: 'Bala Customer' });
await call('POST', '/auth/sync', C3, { intendedRole: 'CUSTOMER', fullName: 'Chitra Customer' });
r = await call('POST', '/auth/sync', C1, { intendedRole: 'PROVIDER', fullName: 'x' });
check('re-sync cannot change role', r.data?.userType === 'CUSTOMER');
check('customer -> /providers/me 403', (await call('GET', '/providers/me', C1)).status === 403);
check('customer -> /admin 403', (await call('GET', '/admin/dashboard', C1)).status === 403);
check('self-registration as admin refused', (await call('POST', '/auth/sync', await token(`user_nobody${run}`), { intendedRole: 'ADMIN' })).status === 403);

console.log('\n# Provider onboarding');
r = await call('POST', '/providers/me/publish', P1);
check('publish blocked while incomplete', r.status === 422, JSON.stringify(r.body));
check('draft provider hidden from search', !(await call('GET', `/search/providers?q=Lakshmi%20${run}`)).data.items.length);
r = await call('PUT', '/providers/me/profile', P1, { name: `Lakshmi ${run}`, businessName: "Lakshmi's Kitchen", bio: 'Traditional Andhra home cooking for family gatherings and festivals.', experienceYears: 12, city: 'Hyderabad', locality: 'Kukatpally', baseLatitude: 17.4948, baseLongitude: 78.3996, maxTravelDistanceKm: 15 });
check('profile saved', r.status === 200, JSON.stringify(r.body));
check('cuisines saved', (await call('PUT', '/providers/me/cuisines', P1, { cuisines: ['ANDHRA', 'TRADITIONAL_HOME'] })).status === 200);
r = await call('POST', '/providers/me/services', P1, { category: 'HOME_CHEF', title: 'Andhra family feast at your home', deliveryMode: 'CHEF_VISITS_HOME', pricingModel: 'PER_PLATE', price: 600 });
check('invalid pricing model for category rejected', r.status === 422, JSON.stringify(r.body));
r = await call('POST', '/providers/me/services', P1, { category: 'PHOTOGRAPHER', title: 'x', deliveryMode: 'ON_SITE', pricingModel: 'PER_EVENT', price: 1 });
check('service in un-offered category rejected', r.status === 422);
r = await call('POST', '/providers/me/services', P1, { category: 'HOME_CHEF', title: 'Andhra family feast at your home', deliveryMode: 'CHEF_VISITS_HOME', pricingModel: 'PER_PERSON', price: 600, minGuests: 5, maxGuests: 40 });
check('home chef service added', r.status === 201, JSON.stringify(r.body));
const homeSvc = r.data.services.find(s => s.category === 'HOME_CHEF');
r = await call('POST', '/providers/me/services', P1, { category: 'CATERER', title: 'Wedding catering', deliveryMode: 'VENUE_BANQUET', pricingModel: 'PER_PLATE', price: 450, minGuests: 50, maxGuests: 1000 });
check('catering service added', r.status === 201);
check('availability saved', (await call('PUT', '/providers/me/availability', P1, { weekly: [], advanceNoticeHours: 0, maxDailyBookings: 1, maxAdvanceDays: 180 })).status === 200);
r = await call('POST', '/providers/me/publish', P1);
check('publish succeeds', r.status === 200 && r.data.onboardingStatus === 'PUBLISHED', JSON.stringify(r.body));
const p1Id = r.data.id;

await call('PUT', '/providers/me/profile', P2, { name: 'Ravi Lens', bio: 'Candid wedding and event photography with same-week delivery.', experienceYears: 6, city: 'Hyderabad', maxTravelDistanceKm: 50 });
await call('POST', '/providers/me/services', P2, { category: 'PHOTOGRAPHER', title: 'Full event coverage', deliveryMode: 'ON_SITE', pricingModel: 'PER_EVENT', price: 15000 });
await call('POST', '/providers/me/services', P2, { category: 'PHOTOGRAPHER', title: 'Custom wedding package', deliveryMode: 'ON_SITE', pricingModel: 'CUSTOM_QUOTE' });
r = await call('POST', '/providers/me/publish', P2);
check('photographer published (no cuisine needed)', r.status === 200, JSON.stringify(r.body));
const p2Id = r.data.id;
const quoteSvc = r.data.services.find(s => s.pricingModel === 'CUSTOM_QUOTE');

console.log('\n# Marketplace search (in-page filters hit the DB)');
const ids = async (qs) => (await call('GET', `/search/providers?${qs}`)).data.items.filter(i => [p1Id, p2Id].includes(i.id));
let items = await ids('category=CATERER');
check('category=CATERER -> only caterer, plate price', items.length === 1 && items[0].id === p1Id && Number(items[0].startingPrice) === 450 && items[0].pricingModel === 'PER_PLATE');
items = await ids('category=HOME_CHEF');
check('category=HOME_CHEF -> per person price', items.length === 1 && Number(items[0].startingPrice) === 600);
items = await ids('category=PHOTOGRAPHER');
check('category=PHOTOGRAPHER -> only photographer', items.length === 1 && items[0].id === p2Id);
items = await ids('category=HOME_CHEF,PHOTOGRAPHER');
check('multiple categories combine (OR)', items.length === 2);
items = await ids('pricingModel=PER_PERSON&minPrice=500&maxPrice=1000');
check('budget 500-1000 per person', items.length === 1 && items[0].id === p1Id);
check('budget below price -> none', (await ids('pricingModel=PER_PERSON&maxPrice=400')).length === 0);
check('cuisine=ANDHRA', (await ids('cuisine=ANDHRA')).map(i => i.id).join() === p1Id);
check('city=Pune -> none', (await ids('city=Pune')).length === 0);
check('text search on service title', (await ids('q=wedding%20catering')).map(i => i.id).join() === p1Id);
check('near Kukatpally 10km includes chef', (await ids('lat=17.49&lng=78.40&radiusKm=10&category=HOME_CHEF')).length === 1);
check('far away (Vijayawada) excludes chef', (await ids('lat=16.50&lng=80.64&radiusKm=50&category=HOME_CHEF')).length === 0);
check('guests=200 excludes home chef (max 40)', (await ids('category=HOME_CHEF&guests=200')).length === 0);
check('verified=true -> none yet', (await ids('verified=true')).length === 0);
check('no fabricated rating', (await ids('category=HOME_CHEF'))[0].averageRating === null);
check('unknown category -> 422', (await call('GET', '/search/providers?category=PIZZA')).status === 422);
let pg = await call('GET', '/search/providers?size=1&page=0');
check('pagination returns total', pg.data.items.length <= 1 && pg.data.total >= 2);
await call('PUT', `/providers/me/services/${homeSvc.id}`, P1, { category: 'HOME_CHEF', title: homeSvc.title, deliveryMode: 'CHEF_VISITS_HOME', pricingModel: 'PER_PERSON', price: 800, minGuests: 5, maxGuests: 40 });
check('provider price change reflected in search', Number((await ids('category=HOME_CHEF'))[0].startingPrice) === 800);
r = await call('GET', `/providers/${p1Id}`);
check('public profile shows real services', r.status === 200 && r.data.services.length === 2 && r.data.baseLatitude === undefined);

console.log('\n# Availability');
check('block date', (await call('POST', '/providers/me/blocked-dates', P1, { date: day(10), reason: 'Family function' })).status === 200);
check('blocked date excluded from search', (await ids(`category=HOME_CHEF&date=${day(10)}`)).length === 0);
check('other date still available', (await ids(`category=HOME_CHEF&date=${day(11)}`)).length === 1);
const req = (date, extra = {}) => ({ providerId: p1Id, serviceId: homeSvc.id, eventDate: date, eventTime: '19:00', eventAddress: '12 Temple Street', eventCity: 'Hyderabad', guestCount: 20, cuisinePreference: 'Andhra', budget: 20000, details: { menu: 'Pulihora, gongura pachadi' }, ...extra });
check('booking on blocked date -> 409', (await call('POST', '/bookings', C1, req(day(10)))).status === 409);
check('guest count above service max -> 422', (await call('POST', '/bookings', C1, req(day(12), { guestCount: 100 }))).status === 422);

console.log('\n# Booking lifecycle');
r = await call('POST', '/bookings', C1, req(day(12)));
check('customer creates request', r.status === 201 && r.data.status === 'PENDING_PROVIDER_CONFIRMATION', JSON.stringify(r.body));
check('server computes estimate (800 x 20)', Number(r.data?.estimatedTotal) === 16000);
const b1 = r.data.id;
check('duplicate open request refused', (await call('POST', '/bookings', C1, req(day(12)))).status === 409);
check('provider cannot create bookings', (await call('POST', '/bookings', P1, req(day(13)))).status === 403);
check('other customer cannot read booking', (await call('GET', `/bookings/${b1}`, C2)).status === 404);
check('other provider cannot read booking', (await call('GET', `/bookings/${b1}`, P2)).status === 404);
check('other provider cannot accept', (await call('POST', `/bookings/${b1}/accept`, P2)).status === 404);
r = await call('GET', `/bookings/${b1}`, P1);
check('provider sees request, address hidden until confirmed', r.status === 200 && r.data.eventAddress === null && r.data.customerPhone === null);
check('provider dashboard counts real request', (await call('GET', '/providers/me/dashboard', P1)).data.newRequests == 1);
check('customer cannot accept own booking as provider', (await call('POST', `/bookings/${b1}/accept`, C1)).status === 403);
r = await call('POST', `/bookings/${b1}/accept`, P1, {});
check('provider accepts -> CONFIRMED', r.data?.status === 'CONFIRMED' && r.data.paymentStatus === 'NOT_REQUIRED', JSON.stringify(r.body));
r = await call('GET', `/bookings/${b1}`, C1);
check('customer sees confirmation + history', r.data.status === 'CONFIRMED' && r.data.history.length === 2);
check('accept twice -> 409', (await call('POST', `/bookings/${b1}/accept`, P1, {})).status === 409);
check('confirmed date no longer bookable (capacity 1)', (await call('POST', '/bookings', C2, req(day(12)))).status === 409);
check('fully booked date excluded from search', (await ids(`category=HOME_CHEF&date=${day(12)}`)).length === 0);
check('complete before event date -> 409', (await call('POST', `/bookings/${b1}/complete`, P1)).status === 409);
check('customer notified', (await call('GET', '/notifications/unread-count', C1)).data.count >= 1);

console.log('\n# Concurrency: two requests, same date, accepted in parallel');
const x1 = (await call('POST', '/bookings', C2, req(day(14)))).data.id;
const x2 = (await call('POST', '/bookings', C3, req(day(14)))).data.id;
const [a1, a2] = await Promise.all([call('POST', `/bookings/${x1}/accept`, P1, {}), call('POST', `/bookings/${x2}/accept`, P1, {})]);
check('exactly one accept wins', [a1.status, a2.status].sort().join() === '200,409', `${a1.status},${a2.status}`);

console.log('\n# Quotation flow');
r = await call('POST', '/bookings', C1, { providerId: p2Id, serviceId: quoteSvc.id, eventDate: day(20), eventTime: '10:00', eventAddress: 'Hall A', eventCity: 'Hyderabad', guestCount: 300 });
check('custom-quote request has no estimate', r.status === 201 && r.data.estimatedTotal === null);
const q1 = r.data.id;
check('direct accept blocked for quote-only service', (await call('POST', `/bookings/${q1}/accept`, P2, {})).status === 422);
r = await call('POST', `/bookings/${q1}/clarify`, P2, { message: 'Is the haldi on the same day?' });
check('provider asks clarification', r.status === 200 && r.data.status === 'PENDING_PROVIDER_CONFIRMATION');
r = await call('POST', `/bookings/${q1}/quotation`, P2, { items: [{ description: 'Photographer (2) full day', unitPrice: 18000, quantity: 2 }, { description: 'Album', unitPrice: 7000, quantity: 1 }], travelCharges: 1500, notes: 'Includes 400 edited photos' });
check('quotation sent', r.data?.status === 'QUOTATION_SENT' && Number(r.data.quotation.total) === 44500, JSON.stringify(r.body));
check('provider cannot accept own quote', (await call('POST', `/bookings/${q1}/quotation/accept`, P2)).status === 403);
r = await call('POST', `/bookings/${q1}/quotation/accept`, C1);
check('customer accepts quote -> CONFIRMED', r.data?.status === 'CONFIRMED' && Number(r.data.finalAmount) === 44500);
r = await call('POST', `/bookings/${q1}/cancel`, C1, { reason: 'Event postponed' });
check('customer cancels', r.data?.status === 'CUSTOMER_CANCELLED');
check('cancel twice -> 409', (await call('POST', `/bookings/${q1}/cancel`, C1, {})).status === 409);
check('review before completion refused', (await call('POST', '/reviews', C1, { bookingId: b1, overallRating: 5 })).status === 409);

console.log('\n# Customer data');
check('favourite add', (await call('PUT', `/customer/favourites/${p1Id}`, C1)).status === 200);
check('favourites isolated per customer', (await call('GET', '/customer/favourites', C2)).data.length === 0 && (await call('GET', '/customer/favourites', C1)).data.length === 1);
r = await call('POST', '/customer/addresses', C1, { addressType: 'HOME', addressLine1: '12 Temple Street', city: 'Hyderabad', state: 'Telangana', postalCode: '500072' });
check('address saved & default', r.status === 200 && r.data[0].isDefault === true);
check('other customer cannot delete it', (await call('DELETE', `/customer/addresses/${r.data[0].id}`, C2)).status === 404);
check('invalid PIN rejected', (await call('POST', '/customer/addresses', C1, { addressType: 'HOME', addressLine1: 'x', city: 'x', state: 'x', postalCode: '12' })).status === 400);

console.log('\n# Admin');
const A = await token('user_admin1');
r = await call('POST', '/auth/sync', A, { intendedRole: 'ADMIN' });
check('bootstrap admin by verified email', r.status === 200 && r.data.userType === 'ADMIN' && r.data.adminRole === 'SUPER_ADMIN', JSON.stringify(r.body));
r = await call('GET', '/admin/dashboard', A);
check('admin dashboard real counts', r.status === 200 && r.data.publishedProviders >= 2 && Number(r.data.completedBookingValue) === 0, JSON.stringify(r.data));
check('reject requires note', (await call('POST', `/admin/providers/${p1Id}/verification`, A, { decision: 'REJECT' })).status === 422);
r = await call('POST', `/admin/providers/${p1Id}/verification`, A, { decision: 'APPROVE' });
check('admin verifies provider', r.data?.verificationStatus === 'VERIFIED');
check('verified filter now finds provider', (await ids('verified=true')).map(i => i.id).join() === p1Id);
check('audit log written', (await call('GET', '/admin/audit-logs', A)).data.items.some(l => l.action === 'PROVIDER_APPROVE'));
r = await call('POST', '/admin/invitations', A, { email: `user_ops${run}@example.test`, role: 'OPS_ADMIN' });
check('invite admin', r.status === 200, JSON.stringify(r.body));
const OPS = await token(`user_ops${run}`);
r = await call('POST', '/auth/sync', OPS, { intendedRole: 'ADMIN' });
check('invited admin can claim with invited role', r.data?.adminRole === 'OPS_ADMIN', JSON.stringify(r.body));
check('ops admin cannot change settings', (await call('PUT', '/admin/settings/booking.payment_required', OPS, { value: 'true' })).status === 403);
const c2Id = (await call('GET', '/auth/me', C2)).data.id;
check('suspend customer', (await call('POST', `/admin/users/${c2Id}/status`, OPS, { status: 'SUSPENDED', reason: 'Test' })).status === 200);
check('suspended customer locked out', (await call('GET', '/bookings', C2)).status === 403);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
