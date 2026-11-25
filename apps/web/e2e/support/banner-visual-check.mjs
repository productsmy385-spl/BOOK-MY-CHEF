// Visual check of all banner placements. Saves screenshots to test-results/banners/ and
// fails if any banner image does not load. Needs the stack from e2e/README.md.
//   node e2e/support/banner-visual-check.mjs
import { chromium } from '@playwright/test';
import { call, token } from './api.js';

const WEB = process.env.E2E_WEB_URL || 'http://localhost:5179';
const run = Date.now().toString(36);
const providerTok = await token(`user_vis${run}`);
await call('POST', '/auth/sync', providerTok, { intendedRole: 'PROVIDER', fullName: `Visual Check ${run}`, city: 'Hyderabad', roles: ['HOME_CHEF'] });
const adminTok = await token('user_admin1');
await call('POST', '/auth/sync', adminTok, { intendedRole: 'ADMIN' });

const pages = [
  ['customer-home', '/', null, 'Discover professional home chefs'],
  ['customer-sign-in', '/auth/customer', null, null],
  ['customer-register', '/auth/customer?mode=register', null, null],
  ['provider-sign-in', '/auth/partner?mode=signin', null, null],
  ['provider-register', '/auth/partner', null, null],
  ['provider-dashboard', '/provider/dashboard', providerTok, 'Grow your chef business with Book My Chef'],
  ['admin-campaigns', '/admin/campaigns', adminTok, null],
];
const browser = await chromium.launch();
const failures = [];
const loaded = new Set();
for (const [w, h, tag] of [[1440, 900, 'desktop'], [390, 844, 'mobile']]) {
  for (const [name, path, tok, expectText] of pages) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    if (tok) await ctx.addInitScript((t) => { window.Clerk = { session: { getToken: async () => t }, signOut: async () => {} }; }, tok);
    const page = await ctx.newPage();
    page.on('response', (r) => {
      if (r.url().includes('/banners/')) {
        if (r.status() !== 200) failures.push(`${tag} ${name}: ${r.status()} ${r.url()}`);
        else loaded.add(r.url().split('/banners/')[1]);
      }
    });
    await page.goto(WEB + path);
    await page.waitForLoadState('networkidle');
    // Banners load after the page data; wait for the carousel before checking it.
    await page.locator('section[aria-label="Promotions"]').first().waitFor({ timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle');
    // The carousel auto-rotates, so check the campaign is in it rather than on screen at this instant.
    if (expectText && !(await page.getByRole('region', { name: 'Promotions' }).first().getByText(expectText).count())) failures.push(`${tag} ${name}: "${expectText}" missing from carousel`);
    if (expectText && !(await page.getByRole('region', { name: 'Promotions' }).first().isVisible())) failures.push(`${tag} ${name}: carousel not visible`);
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc.includes('/banners/')).map((i) => i.currentSrc));
    broken.forEach((b) => failures.push(`${tag} ${name}: broken image ${b}`));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) failures.push(`${tag} ${name}: horizontal overflow ${overflow}px`);
    await page.screenshot({ path: `test-results/banners/${name}-${tag}.png` });
    await ctx.close();
  }
}
await browser.close();
console.log(`banner files loaded: ${loaded.size}`);
console.log(failures.length ? `FAILURES:\n${failures.join('\n')}` : 'all banner placements rendered; every banner image loaded');
process.exit(failures.length ? 1 : 0);
