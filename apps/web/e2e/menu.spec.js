import { expect, test } from '@playwright/test';
import { call, customer, publishedProvider, signInAs } from './support/api.js';

const run = Date.now().toString(36);
let caterer;
let custToken;

test.beforeAll(async () => {
  caterer = await publishedProvider(`user_menucat${run}`, {
    name: `Annapurna Caterers ${run}`, city: `Menupur${run}`, categories: ['CATERER'], cuisines: ['ANDHRA'],
    services: [{ category: 'CATERER', title: 'Wedding buffet', deliveryMode: 'VENUE_BANQUET', pricingModel: 'PER_PLATE', price: 300, minGuests: 50 }],
  });
  custToken = await customer(`user_menucust${run}`, 'Meera');
});

test('provider builds a menu in the console and a customer books with it', async ({ browser }) => {
  // ---- provider adds dishes through the UI
  const prov = await browser.newPage();
  await signInAs(prov, caterer.token);
  await prov.goto('/provider/menu');
  await expect(prov.getByRole('heading', { name: 'Food menu' })).toBeVisible();

  const addDish = async (name, course, price, diet) => {
    await prov.getByRole('button', { name: 'Add a dish' }).click();
    const d = prov.getByRole('dialog', { name: 'New dish' });
    await d.getByLabel('Dish name').fill(name);
    await d.getByLabel('Course').selectOption(course);
    if (diet) await d.getByRole('button', { name: diet }).click();
    await d.getByLabel('Price per person (₹)').fill(String(price));
    await d.getByRole('button', { name: 'Save dish' }).click();
    await expect(d).toBeHidden();
    await expect(prov.getByText(name, { exact: true })).toBeVisible();
  };
  await addDish('Paneer tikka', 'STARTER', 120);
  await addDish('Chicken 65', 'STARTER', 150, 'Non-vegetarian');
  await addDish('Veg biryani', 'RICE', 140);

  // ---- provider builds a set menu: pick 1 starter, 1 rice, ₹350/person
  await prov.getByRole('tab', { name: /Set menus/ }).click();
  await prov.getByRole('button', { name: 'Add a set menu' }).click();
  const s = prov.getByRole('dialog', { name: 'New set menu' });
  await s.getByLabel('Menu name').fill('Wedding lunch');
  await s.getByLabel('Price per person (₹)').fill('350');
  await s.getByLabel('Section 1').fill('Starters');
  await s.getByLabel('Paneer tikka').check();
  await s.getByLabel('Chicken 65').check();
  await s.getByLabel('Extra per person for Chicken 65').fill('40');
  await s.getByRole('button', { name: 'Add section' }).click();
  await s.getByLabel('Section 2').fill('Rice');
  await s.locator('.panel').nth(1).getByLabel('Veg biryani').check();
  await s.getByRole('button', { name: 'Save set menu' }).click();
  await expect(s).toBeHidden();
  await expect(prov.getByText('Wedding lunch', { exact: true })).toBeVisible();
  await expect(prov.getByText(/Starters: pick 1 of 2/)).toBeVisible();

  // ---- customer sees the menu on the profile and books with it
  const cust = await browser.newPage();
  await signInAs(cust, custToken);
  await cust.goto(`/p/${caterer.id}`);
  await expect(cust.getByRole('heading', { name: 'Menu' })).toBeVisible();
  await cust.getByRole('button', { name: 'Request booking' }).first().click();

  await cust.getByLabel('Date').fill(new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10));
  await cust.getByLabel('Number of guests').fill('200');
  await cust.getByLabel('Event address').fill('Sri Convention Hall, Madhapur');
  await cust.getByLabel('City').fill('Hyderabad');

  await cust.getByRole('radio', { name: /Set menus/ }).check();
  await cust.getByRole('radio', { name: /Wedding lunch/ }).check();
  await expect(cust.getByText(/Still to choose: Starters/)).toBeVisible();
  await cust.getByRole('button', { name: /Chicken 65/ }).click();
  await cust.getByRole('button', { name: /Veg biryani/ }).click();

  // 200 guests × (350 + 40) = ₹78,000 — the menu replaces the ₹300 plate rate
  await expect(cust.getByText('Food: 200 guests × ₹390')).toBeVisible();
  await expect(cust.getByText('₹78,000').last()).toBeVisible();

  await cust.getByRole('button', { name: 'Send booking request' }).click();
  await expect(cust.getByText('Request sent.')).toBeVisible();
  await expect(cust.getByRole('heading', { name: 'Wedding lunch' })).toBeVisible();
  await expect(cust.getByText('Chicken 65')).toBeVisible();
  await expect(cust.getByText('₹78,000').first()).toBeVisible();

  // ---- the provider sees the same menu on the request, and the quotation starts from it
  const bookingId = cust.url().split('/').pop();
  await prov.goto(`/provider/bookings/${bookingId}`);
  await expect(prov.getByRole('heading', { name: 'Wedding lunch' })).toBeVisible();
  await prov.getByRole('button', { name: 'Send quotation' }).click();
  await expect(prov.getByLabel('Item 1')).toHaveValue('Wedding lunch (per person)');
  await expect(prov.getByLabel('Unit price (₹)')).toHaveValue('390');

  const b = await call('GET', `/bookings/${bookingId}`, custToken);
  expect(Number(b.estimatedTotal)).toBe(78000);
});

test('build-your-own menu at phone width shows a live per-person total', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  await signInAs(page, custToken);
  await page.goto(`/book/${caterer.id}`);
  await page.getByLabel('Number of guests').fill('100');
  await page.getByRole('radio', { name: /Build your own/ }).check();
  await page.getByRole('button', { name: /Paneer tikka/ }).click();
  await page.getByRole('button', { name: /Veg biryani/ }).click();
  await expect(page.getByText('2 dishes · ₹260 per person')).toBeVisible();
  await expect(page.getByText('₹26,000').last()).toBeVisible();

  await page.getByRole('button', { name: /Veg only/ }).click();
  await expect(page.getByRole('button', { name: /Chicken 65/ })).toHaveCount(0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'test-results/screens/menu-builder-360.png', fullPage: true });
});
