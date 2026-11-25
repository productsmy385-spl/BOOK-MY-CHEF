import { expect, test } from '@playwright/test';
import { call, customer, publishedProvider, signInAs } from './support/api.js';

const run = Date.now().toString(36);
const CITY = `Eventpur${run}`;

let custToken;

test.beforeAll(async () => {
  await publishedProvider(`user_evuicat${run}`, {
    name: `Feast Caterers ${run}`, city: CITY, categories: ['CATERER'], cuisines: ['ANDHRA'],
    services: [{ category: 'CATERER', title: 'Wedding buffet', deliveryMode: 'VENUE_BANQUET', pricingModel: 'PER_PLATE', price: 400, minGuests: 50 }],
  });
  custToken = await customer(`user_evuicust${run}`, 'Meera');
});

test('customer plans a wedding, books a caterer for it and tracks the budget', async ({ browser }) => {
  const page = await browser.newPage();
  await signInAs(page, custToken);
  await page.goto('/events/new?type=WEDDING');

  await expect(page.getByRole('radio', { name: 'Wedding' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('button', { name: 'Catering' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Event name').fill('Priya & Arjun reception');
  await page.getByLabel('Date').fill(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  await page.getByLabel('Guests').fill('200');
  await page.getByLabel('Total budget (₹)').fill('100000');
  await page.getByLabel('City').fill(CITY);
  await page.getByRole('button', { name: 'Create event' }).click();

  await expect(page.getByRole('heading', { name: 'Priya & Arjun reception' })).toBeVisible();
  await expect(page.getByText('0 of 6 services booked')).toBeVisible();
  await expect(page.getByText('In 30 days')).toBeVisible();

  // Find a caterer: planning bar follows the customer through Explore -> profile -> booking form
  await page.getByRole('listitem').filter({ has: page.getByText('Catering', { exact: true }) }).getByRole('button', { name: 'Find providers' }).click();
  await expect(page).toHaveURL(/\/explore\?.*category=CATERER/);
  await expect(page.getByText('Planning for')).toBeVisible();
  await page.getByRole('link', { name: `View ${'Feast Caterers ' + run}` }).first().click();
  await page.getByRole('button', { name: 'Request booking' }).first().click();
  await expect(page.getByLabel('For one of your events?')).toHaveValue(/.+/);
  await expect(page.getByLabel('Number of guests')).toHaveValue('200');
  await page.getByLabel('Event address').fill('Sri Convention, Madhapur');
  await expect(page.getByText('₹80,000').last()).toBeVisible();
  await page.getByRole('button', { name: 'Send booking request' }).click();
  await expect(page.getByText('Part of')).toBeVisible();

  // Event dashboard reflects the request
  await page.getByRole('link', { name: /View event/ }).click();
  // Checklist item (its label is exactly "Catering"; the timeline entry reads "Catering — <provider>")
  const cateringItem = page.getByRole('listitem').filter({ has: page.getByText('Catering', { exact: true }) });
  // The checklist status and the booking row inside it both read "Requested"
  await expect(cateringItem.getByText('Requested', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('₹80,000').first()).toBeVisible();
  await expect(page.getByText('Left to spend')).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'test-results/screens/event-detail-360.png', fullPage: true });
});

test('home page layout at phone, tablet and desktop widths', async ({ browser }) => {
  // Own data: a failed earlier test restarts the worker with a fresh customer
  await call('POST', '/customer/events', custToken, {
    title: 'Housewarming', eventType: 'HOUSEWARMING', eventDate: new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10), city: CITY, guestCount: 40,
  });
  for (const [w, h] of [[360, 800], [768, 1000], [1280, 900]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await signInAs(page, custToken);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'What do you need?' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Plan by occasion' })).toBeVisible();
    // Loads after the account; the dev server can be slow on first load
    await expect(page.getByRole('heading', { name: 'Your events' })).toBeVisible({ timeout: 15000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.screenshot({ path: `test-results/screens/home-${w}.png`, fullPage: true });
  }
});
