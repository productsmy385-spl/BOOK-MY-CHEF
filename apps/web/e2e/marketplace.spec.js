import { expect, test } from '@playwright/test';
import { call, customer, publishedProvider, signInAs } from './support/api.js';

const run = Date.now().toString(36);
const CITY = `Testpur${run}`; // unique city isolates this run's providers
let chef;
let caterer;
let photographer;

test.beforeAll(async () => {
  chef = await publishedProvider(`user_e2echef${run}`, {
    name: `Lakshmi Kitchen ${run}`, city: CITY, categories: ['HOME_CHEF'], cuisines: ['ANDHRA'],
    services: [{ category: 'HOME_CHEF', title: 'Andhra meal at your home', deliveryMode: 'CHEF_VISITS_HOME', pricingModel: 'PER_PERSON', price: 650, minGuests: 5, maxGuests: 40 }],
  });
  caterer = await publishedProvider(`user_e2ecat${run}`, {
    name: `Royal Caterers ${run}`, city: CITY, categories: ['CATERER'], cuisines: ['SOUTH_INDIAN'],
    services: [{ category: 'CATERER', title: 'Wedding buffet', deliveryMode: 'VENUE_BANQUET', pricingModel: 'PER_PLATE', price: 420, minGuests: 50 }],
  });
  photographer = await publishedProvider(`user_e2ephoto${run}`, {
    name: `Lens Studio ${run}`, city: CITY, categories: ['PHOTOGRAPHER'],
    services: [{ category: 'PHOTOGRAPHER', title: 'Event coverage', deliveryMode: 'ON_SITE', pricingModel: 'PER_EVENT', price: 15000 }],
  });
});

const cards = (page) => page.locator('article');

test('category chips filter results on the same page', async ({ page }) => {
  await page.goto(`/explore?city=${CITY}`);
  await expect(cards(page)).toHaveCount(3);

  await page.getByRole('toolbar', { name: 'Service category' }).getByRole('button', { name: 'Catering', exact: true }).click();
  await expect(page).toHaveURL(/\/explore\?.*category=CATERER/);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText(`Royal Caterers ${run}`);
  await expect(cards(page).first()).toContainText('per plate');

  await page.getByRole('toolbar', { name: 'Service category' }).getByRole('button', { name: 'Home Chef', exact: true }).click();
  await expect(page).toHaveURL(/category=HOME_CHEF/);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText(`Lakshmi Kitchen ${run}`);

  // Survives a refresh
  await page.reload();
  await expect(cards(page)).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Home Chef', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(cards(page)).toHaveCount(3);
});

test('filter drawer applies budget and shows removable chips', async ({ page }) => {
  await page.goto(`/explore?city=${CITY}`);
  await page.getByRole('button', { name: 'Filters' }).click();
  const drawer = page.getByRole('dialog', { name: 'Filters' });
  await drawer.getByLabel('Price basis').selectOption('PER_PERSON');
  await drawer.getByLabel('Min (₹)').fill('500');
  await drawer.getByLabel('Max (₹)').fill('1000');
  await drawer.getByRole('button', { name: 'Show results' }).click();

  await expect(page).toHaveURL(/pricingModel=PER_PERSON/);
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first()).toContainText(`Lakshmi Kitchen ${run}`);

  await page.getByRole('button', { name: /Remove filter .*per person/ }).click();
  await expect(cards(page)).toHaveCount(3);
});

test('no matches shows an empty state, never unrelated providers', async ({ page }) => {
  await page.goto(`/explore?city=${CITY}&category=DECORATOR`);
  await expect(page.getByText('No providers match these filters')).toBeVisible();
  await expect(cards(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page).toHaveURL(/\/explore$/);
});

test('provider price change is reflected in the marketplace', async ({ page }) => {
  const svc = chef.services[0];
  await call('PUT', `/providers/me/services/${svc.id}`, chef.token, { ...svc, price: 700, description: null, active: true, deliveryMode: svc.deliveryMode, category: svc.category });
  await page.goto(`/explore?city=${CITY}&category=HOME_CHEF`);
  await expect(cards(page).first()).toContainText('₹700');
});

test('customer requests a booking and the provider accepts it', async ({ browser }) => {
  const custToken = await customer(`user_e2ecust${run}`, 'Asha Rao');
  const cust = await browser.newPage();
  await signInAs(cust, custToken);
  await cust.goto(`/p/${chef.id}`);
  await cust.getByRole('button', { name: 'Request booking' }).first().click();
  await expect(cust).toHaveURL(new RegExp(`/book/${chef.id}`));

  const date = new Date(Date.now() + 9 * 86400000).toISOString().slice(0, 10);
  await cust.getByLabel('Date').fill(date);
  await cust.getByLabel('Number of guests').fill('12');
  await cust.getByLabel('Your home address').fill('12 Temple Street, Kukatpally');
  await cust.getByLabel('City').fill('Hyderabad');
  await cust.getByLabel('Menu you have in mind').fill('Pulihora, gongura pachadi, pappu');
  // Estimate is shown live: current per-person price x 12 guests
  const price = Number((await call('GET', `/providers/${chef.id}`)).services[0].price);
  const expected = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price * 12);
  await expect(cust.getByText(expected, { exact: true })).toBeVisible();
  await cust.getByRole('button', { name: 'Send booking request' }).click();
  await expect(cust.getByText('Request sent.')).toBeVisible();
  await expect(cust.getByText('Requested', { exact: true }).first()).toBeVisible();
  const bookingUrl = cust.url();
  const bookingId = bookingUrl.split('/').pop();

  const prov = await browser.newPage();
  await signInAs(prov, chef.token);
  await prov.goto('/provider/bookings');
  await prov.getByRole('link', { name: /Andhra meal at your home/ }).first().click();
  await expect(prov.getByText('full address shared once confirmed')).toBeVisible();
  await prov.getByRole('button', { name: 'Accept booking' }).click();
  await expect(prov.getByText('Confirmed', { exact: true }).first()).toBeVisible();

  await cust.goto(`/bookings/${bookingId}`);
  await expect(cust.getByText('Confirmed', { exact: true }).first()).toBeVisible();
  await expect(cust.getByText('Contact')).toBeVisible();
});

test('signed-out visitors are sent to sign in for personal pages', async ({ page }) => {
  await page.goto('/bookings');
  await expect(page).toHaveURL(/\/auth\/customer\?next=%2Fbookings/);
});

test('customers cannot open the provider or admin consoles', async ({ browser }) => {
  const page = await browser.newPage();
  await signInAs(page, await customer(`user_e2ecust2${run}`, 'Bala'));
  await page.goto('/provider/dashboard');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/$/);
});

for (const width of [360, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
  test(`no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', `/explore?city=${CITY}`, `/p/${chef.id}`]) {
      await page.goto(path);
      await expect(page.locator('main')).toBeVisible();
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} overflows at ${width}px`).toBeLessThanOrEqual(0);
    }
    await page.goto(`/explore?city=${CITY}`);
    await page.screenshot({ path: `test-results/screens/explore-${width}.png`, fullPage: false });
  });
}
