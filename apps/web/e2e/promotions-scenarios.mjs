// API scenarios for campaigns, provider promotions, featured/top-rated/nearby discovery,
// ImageKit media and banner analytics. Needs backend + support/fake-clerk.mjs (see README).
const API = process.env.API || 'http://localhost:8081/api/v1';
const CLERK = 'http://localhost:9999';
const IK_PRIVATE = process.env.FAKE_IMAGEKIT_PRIVATE_KEY || 'private_test_key';
const run = Date.now().toString(36);
let pass = 0; let fail = 0;
const check = (name, cond, extra = '') => { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; console.log(`  FAIL ${name} ${extra}`); } };
const token = async (sub) => (await (await fetch(`${CLERK}/token?sub=${sub}&ttl=3600`)).json()).token;
async function call(method, path, tok, body) {
  const res = await fetch(API + path, { method, headers: { 'content-type': 'application/json', ...(tok ? { authorization: `Bearer ${tok}` } : {}) },
    body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, body: json, data: json?.data, raw: text };
}
/** Uploads like the browser does: signed params from our API, then multipart to ImageKit. */
async function upload(tok, purpose, { mime = 'image/png', name = 'banner.png' } = {}) {
  const auth = await call('GET', `/media/upload-auth?purpose=${purpose}`, tok);
  if (auth.status !== 200) return { auth };
  const fd = new FormData();
  fd.append('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')], { type: mime }), name);
  for (const k of ['token', 'expire', 'signature', 'publicKey', 'folder']) fd.append(k, String(auth.data[k]));
  fd.append('fileName', name);
  const up = await (await fetch(auth.data.uploadUrl, { method: 'POST', body: fd })).json();
  const reg = await call('POST', '/media/assets', tok, { fileId: up.fileId, purpose });
  return { auth, up, reg, asset: reg.data };
}
const day = (n) => new Date(Date.now() + n * 86400000).toISOString();

console.log('\n# Setup');
const A = await token(`user_pa${run}`); const B = await token(`user_pb${run}`); const C = await token(`user_cu${run}`); const ADM = await token('user_admin1');
await call('POST', '/auth/sync', A, { intendedRole: 'PROVIDER', fullName: `Anu Chef ${run}`, city: 'Hyderabad', roles: ['HOME_CHEF'] });
await call('POST', '/auth/sync', B, { intendedRole: 'PROVIDER', fullName: `Bala Caterer ${run}`, city: 'Hyderabad', roles: ['CATERER'] });
await call('POST', '/auth/sync', C, { intendedRole: 'CUSTOMER', fullName: 'Chitra', city: 'Hyderabad' });
check('admin signs in', (await call('POST', '/auth/sync', ADM, { intendedRole: 'ADMIN' })).data?.userType === 'ADMIN');
for (const [tok, cat, mode, price, lat] of [[A, 'HOME_CHEF', 'CHEF_VISITS_HOME', 700, 17.4948], [B, 'CATERER', 'VENUE_BANQUET', 400, 16.5]]) {
  await call('PUT', '/providers/me/profile', tok, { name: tok === A ? `Anu Chef ${run}` : `Bala Caterer ${run}`, city: 'Hyderabad',
    bio: 'Experienced professional cooking for families and events across the city.', experienceYears: 9, baseLatitude: lat, baseLongitude: 78.3996, maxTravelDistanceKm: 20 });
  if (cat === 'HOME_CHEF') await call('PUT', '/providers/me/cuisines', tok, { cuisines: ['ANDHRA'] });
  if (cat === 'CATERER') await call('PUT', '/providers/me/cuisines', tok, { cuisines: ['SOUTH_INDIAN'] });
  await call('POST', '/providers/me/services', tok, { category: cat, title: `${cat} service`, deliveryMode: mode, pricingModel: cat === 'CATERER' ? 'PER_PLATE' : 'PER_PERSON', price });
}
const pa = (await call('POST', '/providers/me/publish', A)).data; const pb = (await call('POST', '/providers/me/publish', B)).data;
check('providers published', pa?.onboardingStatus === 'PUBLISHED' && pb?.onboardingStatus === 'PUBLISHED');

console.log('\n# ImageKit media');
let r = await call('GET', '/media/upload-auth?purpose=PROVIDER_BANNER', A);
check('upload-auth signs for provider folder', r.status === 200 && r.data.folder.startsWith('/book-my-chef/provider-banners/'));
check('private key never returned', !r.raw.includes(IK_PRIVATE));
check('customer cannot get banner upload auth', (await call('GET', '/media/upload-auth?purpose=PROVIDER_BANNER', C)).status === 403);
check('provider cannot upload platform banners', (await call('GET', '/media/upload-auth?purpose=PLATFORM_BANNER', A)).status === 403);
const aImg = await upload(A, 'PROVIDER_BANNER');
check('provider upload verified & recorded', aImg.reg.status === 200 && aImg.asset?.url && aImg.asset.mimeType === 'image/png', JSON.stringify(aImg.reg.body));
const bImg = await upload(B, 'PROVIDER_BANNER');
check('provider A cannot claim B\'s file', (await call('POST', '/media/assets', A, { fileId: bImg.up.fileId, purpose: 'PROVIDER_BANNER' })).status === 403);
const bad = await upload(A, 'PROVIDER_BANNER', { mime: 'text/plain', name: 'x.txt' });
check('non-image rejected and removed', bad.reg.status === 422);
check('re-registering same file is idempotent', (await call('POST', '/media/assets', A, { fileId: aImg.up.fileId, purpose: 'PROVIDER_BANNER' })).data?.id === aImg.asset.id);

console.log('\n# Provider banners & approval');
r = await call('POST', '/providers/me/banners', A, { title: 'Authentic Andhra home cooking', offerText: '10% off family meals', category: 'HOME_CHEF', ctaText: 'Book now', desktopAssetId: aImg.asset.id });
check('provider creates draft', r.status === 201 && r.data.status === 'DRAFT', JSON.stringify(r.body));
const banA = r.data.id;
check('banner using B\'s image rejected', (await call('POST', '/providers/me/banners', A, { title: 'x', desktopAssetId: bImg.asset.id })).status === 403);
check('category must be one you offer', (await call('POST', '/providers/me/banners', A, { title: 'x', category: 'CATERER', desktopAssetId: aImg.asset.id })).status === 422);
const pub = async () => (await call('GET', '/public/providers/promotions')).data.map((x) => x.id);
check('draft not public', !(await pub()).includes(banA));
check('provider B cannot edit A\'s banner', (await call('PUT', `/providers/me/banners/${banA}`, B, { title: 'hijack', desktopAssetId: bImg.asset.id })).status === 404);
check('provider B cannot submit A\'s banner', (await call('POST', `/providers/me/banners/${banA}/submit`, B)).status === 404);
r = await call('POST', `/providers/me/banners/${banA}/submit`, A);
check('submit -> pending approval', r.data?.status === 'PENDING_APPROVAL');
check('pending not public', !(await pub()).includes(banA));
check('cannot edit while under review', (await call('PUT', `/providers/me/banners/${banA}`, A, { title: 'x', desktopAssetId: aImg.asset.id })).status === 409);
check('provider cannot approve own banner', (await call('POST', `/admin/provider-banners/${banA}/approve`, A)).status === 403);
check('customer cannot approve', (await call('POST', `/admin/provider-banners/${banA}/approve`, C)).status === 403);
check('reject needs a note', (await call('POST', `/admin/provider-banners/${banA}/reject`, ADM, {})).status === 422);
r = await call('POST', `/admin/provider-banners/${banA}/request-changes`, ADM, { note: 'Use a brighter photo' });
check('admin requests changes', r.data?.status === 'CHANGES_REQUESTED' && r.data.reviewNote === 'Use a brighter photo');
await call('PUT', `/providers/me/banners/${banA}`, A, { title: 'Authentic Andhra home cooking', offerText: '10% off family meals', category: 'HOME_CHEF', ctaText: 'Book now', desktopAssetId: aImg.asset.id });
await call('POST', `/providers/me/banners/${banA}/submit`, A);
r = await call('POST', `/admin/provider-banners/${banA}/approve`, ADM, {});
check('admin approves', r.data?.status === 'APPROVED');
check('approved banner is public', (await pub()).includes(banA));
check('public filter by provider', (await call('GET', `/public/providers/promotions?providerId=${pa.id}`)).data.every((x) => x.providerId === pa.id));
check('provider notified', (await call('GET', '/notifications', A)).data.items.some((n) => n.type === 'BANNER_APPROVED'));
r = await call('POST', `/providers/me/banners/${banA}/pause`, A);
check('provider pauses -> hidden', r.data?.status === 'PAUSED' && !(await pub()).includes(banA));
await call('POST', `/providers/me/banners/${banA}/resume`, A);
check('resume -> visible', (await pub()).includes(banA));
r = await call('PUT', `/providers/me/banners/${banA}`, A, { title: 'New title', category: 'HOME_CHEF', desktopAssetId: aImg.asset.id });
check('editing live banner returns it to draft (re-approval)', r.data?.status === 'DRAFT' && !(await pub()).includes(banA));
await call('POST', `/providers/me/banners/${banA}/submit`, A); await call('POST', `/admin/provider-banners/${banA}/approve`, ADM, {});

console.log('\n# Platform campaigns');
const camp = await upload(ADM, 'PLATFORM_BANNER');
check('admin uploads campaign image', camp.reg.status === 200);
const campaignBody = { title: 'Discover the best home chefs', subtitle: 'Traditional food, cooked at your home', ctaText: 'Explore chefs',
  destinationType: 'CATEGORY', destinationRef: 'HOME_CHEF', desktopAssetId: camp.asset.id, placements: ['HOME', 'SIGN_IN'], priority: 5 };
check('external link destination rejected', (await call('POST', '/admin/banners', ADM, { ...campaignBody, destinationType: 'PATH', destinationRef: '//evil.example' })).status === 422);
check('CATEGORY placement needs a category', (await call('POST', '/admin/banners', ADM, { ...campaignBody, placements: ['CATEGORY'] })).status === 422);
check('provider cannot create campaigns', (await call('POST', '/admin/banners', A, campaignBody)).status === 403);
r = await call('POST', '/admin/banners', ADM, campaignBody);
check('campaign created as draft', r.status === 201 && r.data.status === 'DRAFT' && r.data.href === '/explore?category=HOME_CHEF', JSON.stringify(r.body));
const campId = r.data.id;
const live = async (pl) => (await call('GET', `/public/banners?placement=${pl}`)).data.map((x) => x.id);
check('draft campaign not public', !(await live('HOME')).includes(campId));
r = await call('POST', `/admin/banners/${campId}/publish`, ADM);
check('publish -> on HOME and SIGN_IN only', r.data?.status === 'PUBLISHED' && (await live('HOME')).includes(campId) && (await live('SIGN_IN')).includes(campId) && !(await live('REGISTER')).includes(campId));
await call('PUT', `/admin/banners/${campId}`, ADM, { ...campaignBody, startAt: day(2) });
check('future start date -> scheduled, not shown', !(await live('HOME')).includes(campId));
await call('PUT', `/admin/banners/${campId}`, ADM, { ...campaignBody, startAt: day(-3), endAt: day(-1) });
check('past end date -> expired, not shown', !(await live('HOME')).includes(campId));
check('cannot publish an ended campaign', (await call('POST', `/admin/banners/${campId}/unpublish`, ADM)).status === 200
  && (await call('POST', `/admin/banners/${campId}/publish`, ADM)).status === 422);
await call('PUT', `/admin/banners/${campId}`, ADM, campaignBody); await call('POST', `/admin/banners/${campId}/publish`, ADM);
r = await call('POST', `/admin/banners/${campId}/duplicate`, ADM);
check('duplicate creates draft copy', r.data?.status === 'DRAFT' && r.data.title.startsWith('Copy of'));
check('delete draft copy', (await call('DELETE', `/admin/banners/${r.data.id}`, ADM)).status === 200);

console.log('\n# AI images');
r = await call('GET', '/admin/ai-images/config', ADM);
check('AI config reports provider & presets', r.data?.enabled === true && r.data.presets.length >= 8);
r = await call('POST', '/admin/ai-images', ADM, { preset: 'WEDDING_CATERING', format: 'DESKTOP' });
check('AI image generated and stored in ImageKit', r.status === 200 && r.data.source === 'AI' && r.data.url, JSON.stringify(r.body));
check('provider cannot generate AI images', (await call('POST', '/admin/ai-images', A, { preset: 'WEDDING_CATERING', format: 'DESKTOP' })).status === 403);

console.log('\n# Discovery');
r = await call('POST', `/admin/providers/${pa.id}/feature`, ADM, { placement: 'HOME_FEATURED', priority: 10 });
check('admin features provider', r.status === 200);
check('featured list contains provider', (await call('GET', '/public/providers/featured')).data.some((p) => p.id === pa.id));
check('featured does not imply verified', (await call('GET', '/public/providers/featured')).data.find((p) => p.id === pa.id).verified === false);
r = await call('GET', '/public/providers/top-rated');
check('top-rated needs genuine reviews (none yet -> empty)', r.data.minReviews >= 1 && !r.data.items.some((p) => p.id === pa.id));
r = await call('GET', '/public/providers/nearby?lat=17.49&lng=78.40&radiusKm=10');
check('nearby finds close chef with distance', r.data.some((p) => p.id === pa.id && p.distanceKm != null));
check('nearby excludes far provider', !(await call('GET', '/public/providers/nearby?lat=17.49&lng=78.40&radiusKm=10&category=CATERER')).data.some((p) => p.id === pb.id));

console.log('\n# Analytics');
const ev = (id, kind, type, visitorId) => call('POST', `/public/banners/${id}/${type}`, null, { kind, placement: 'HOME', visitorId });
check('first impression counted', (await ev(campId, 'PLATFORM', 'impression', `visitor-${run}`)).data?.counted === true);
check('repeat impression same day ignored', (await ev(campId, 'PLATFORM', 'impression', `visitor-${run}`)).data?.counted === false);
check('click counted', (await ev(campId, 'PLATFORM', 'click', `visitor-${run}`)).data?.counted === true);
check('provider banner impression counted', (await ev(banA, 'PROVIDER', 'impression', `visitor-${run}`)).data?.counted === true);
const draftCamp = (await call('POST', '/admin/banners', ADM, campaignBody)).data.id;
check('events on unpublished banner not counted', (await ev(draftCamp, 'PLATFORM', 'impression', `visitor-${run}`)).data?.counted === false);
r = await call('GET', '/admin/banner-analytics?days=30', ADM);
const cs = r.data.campaigns.find((c) => c.id === campId);
check('analytics shows real counts', cs && Number(cs.impressions) === 1 && Number(cs.clicks) === 1, JSON.stringify(cs));
check('provider sees own banner stats', (await call('GET', '/providers/me/banners', A)).data.find((b) => b.id === banA).impressions == 1);

console.log('\n# Media deletion');
check('image in use cannot be deleted', (await call('DELETE', `/media/assets/${aImg.asset.id}`, A)).status === 409);
check('other provider cannot delete it', (await call('DELETE', `/media/assets/${aImg.asset.id}`, B)).status === 404);
await call('DELETE', `/providers/me/banners/${banA}`, A);
check('after removing banner, image can be deleted', (await call('DELETE', `/media/assets/${aImg.asset.id}`, A)).status === 200);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
