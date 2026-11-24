import { expect, test } from '@playwright/test';
import { call, customer, publishedProvider, signInAs, token } from './support/api.js';

const run = Date.now().toString(36);
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
let chef; let bartender; let admin; let campaignTitle;

/** Same flow the browser uses: signed params from our API, multipart to ImageKit, then register. */
async function uploadAsset(tok, purpose) {
  const auth = await call('GET', `/media/upload-auth?purpose=${purpose}`, tok);
  const fd = new FormData();
  fd.append('file', new Blob([PNG], { type: 'image/png' }), 'img.png');
  for (const k of ['token', 'expire', 'signature', 'publicKey', 'folder']) fd.append(k, String(auth[k]));
  fd.append('fileName', 'img.png');
  const up = await (await fetch(auth.uploadUrl, { method: 'POST', body: fd })).json();
  return call('POST', '/media/assets', tok, { fileId: up.fileId, purpose });
}

test.beforeAll(async () => {
  chef = await publishedProvider(`user_pchef${run}`, {
    name: `Promo Chef ${run}`, city: 'Hyderabad', categories: ['HOME_CHEF'], cuisines: ['ANDHRA'],
    services: [{ category: 'HOME_CHEF', title: 'Andhra meal', deliveryMode: 'CHEF_VISITS_HOME', pricingModel: 'PER_PERSON', price: 650 }],
  });
  bartender = await publishedProvider(`user_pbar${run}`, {
    name: `Shaker Bar ${run}`, city: 'Hyderabad', categories: ['BARTENDER'],
    services: [{ category: 'BARTENDER', title: 'Cocktail bar for parties', deliveryMode: 'ON_SITE', pricingModel: 'PER_EVENT', price: 9000 }],
  });
  admin = await token('user_admin1');
  await call('POST', '/auth/sync', admin, { intendedRole: 'ADMIN' });
  const img = await uploadAsset(admin, 'PLATFORM_BANNER');
  campaignTitle = `Celebrate with Book My Chef ${run}`;
  const c = await call('POST', '/admin/banners', admin, {
    title: campaignTitle, subtitle: 'Chefs for every family occasion', ctaText: 'Find a chef', destinationType: 'CATEGORY',
    destinationRef: 'HOME_CHEF', desktopAssetId: img.id, placements: ['HOME', 'SIGN_IN', 'EXPLORE'], priority: 100,
  });
  await call('POST', `/admin/banners/${c.id}/publish`, admin);
  await call('POST', `/admin/providers/${chef.id}/feature`, admin, { placement: 'HOME_FEATURED', priority: 100 });
});

test('homepage shows live campaign, featured chef, and the campaign button applies the filter', async ({ page }) => {
  await page.goto('/');
  const carousel = page.getByRole('region', { name: 'Promotions' });
  await expect(carousel.getByText(campaignTitle)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Featured chefs' })).toBeVisible();
  await expect(page.locator('article').filter({ hasText: `Promo Chef ${run}` }).first()).toBeVisible();
  await carousel.getByRole('link', { name: campaignTitle }).click();
  await expect(page).toHaveURL(/\/explore\?category=HOME_CHEF/);
});

test('customer sign-in page shows the SIGN_IN campaign', async ({ page }) => {
  await page.goto('/auth/customer');
  await expect(page.getByText(campaignTitle)).toBeVisible();
});

test('Bartender chip shows only bartenders (regression)', async ({ page }) => {
  await page.goto('/explore?city=Hyderabad');
  await page.getByRole('toolbar', { name: 'Service category' }).getByRole('button', { name: 'Bartender', exact: true }).click();
  await expect(page).toHaveURL(/category=BARTENDER/);
  const cards = page.locator('article');
  await expect(cards.filter({ hasText: `Shaker Bar ${run}` })).toHaveCount(1);
  await expect(cards.filter({ hasText: `Promo Chef ${run}` })).toHaveCount(0);
  const labels = await cards.locator('a > span').allInnerTexts();
  expect(labels.every((l) => l === 'Bartender')).toBe(true);
});

test('provider uploads a banner, admin approves it, customers see it as Sponsored', async ({ browser }) => {
  const prov = await browser.newPage();
  await signInAs(prov, chef.token);
  await prov.goto('/provider/promotions');
  await prov.getByRole('button', { name: 'New banner' }).click();
  const drawer = prov.getByRole('dialog', { name: 'New banner' });
  await drawer.locator('input[type=file]').first().setInputFiles({ name: 'banner.png', mimeType: 'image/png', buffer: PNG });
  await expect(drawer.getByRole('button', { name: 'Replace' })).toBeVisible();
  await drawer.getByLabel('Title').fill(`Weekend Andhra feast ${run}`);
  await drawer.getByLabel('Offer (optional)').fill('10% off this month');
  await drawer.getByRole('button', { name: 'Save & submit' }).click();
  await expect(prov.getByText('Awaiting approval')).toBeVisible();

  const adm = await browser.newPage();
  await signInAs(adm, admin);
  await adm.goto('/admin/promotions');
  const item = adm.locator('li').filter({ hasText: `Weekend Andhra feast ${run}` });
  await item.getByRole('button', { name: 'Approve' }).click();
  await adm.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
  await expect(item).toHaveCount(0);

  const cust = await browser.newPage();
  await cust.goto('/');
  const promo = cust.getByRole('link').filter({ hasText: `Weekend Andhra feast ${run}` });
  await expect(promo).toBeVisible();
  await expect(promo.getByText('Sponsored')).toBeVisible();
  await promo.click();
  await expect(cust).toHaveURL(new RegExp(`/p/${chef.id}`));
  await expect(cust.getByRole('heading', { name: 'Current offers' })).toBeVisible();
});

test('admin consoles reject customers', async ({ browser }) => {
  const page = await browser.newPage();
  await signInAs(page, await customer(`user_pcust${run}`, 'Promo Customer'));
  await page.goto('/admin/campaigns');
  await expect(page).toHaveURL(/\/$/);
});

for (const width of [360, 375, 390, 430, 768, 1024, 1280, 1440]) {
  test(`homepage with banners has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByText(campaignTitle)).toBeVisible();
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `test-results/screens/home-${width}.png` });
  });
}
