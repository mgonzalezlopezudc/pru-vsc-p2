const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://127.0.0.1:5000';

test.describe.configure({ mode: 'serial' });

async function openHome(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
}

test('smoke: navegación entre home, tienda, producto e inventario', async ({ page }) => {
  await openHome(page);

  const firstStoreLink = page.locator('a[href^="/stores/"]').first();
  await expect(firstStoreLink).toBeVisible();
  await firstStoreLink.click();
  await expect(page).toHaveURL(/\/stores\//);

  const firstProductLinkFromStore = page.locator('a[href^="/products/"]').first();
  await expect(firstProductLinkFromStore).toBeVisible();
  await firstProductLinkFromStore.click();
  await expect(page).toHaveURL(/\/products\//);

  await page.locator('a[href*="/inventory"]').first().click();
  await expect(page).toHaveURL(/\/inventory/);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});

test('crud: crear y borrar tienda desde la UI', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const storeName = `Playwright Store ${uniqueSuffix}`;

  await openHome(page);

  const createStoreForm = page.locator('form[action*="/stores/create"]');
  await createStoreForm.locator('input[name="store_create-name"]').fill(storeName);
  await createStoreForm.locator('input[name="store_create-address"]').fill(`Calle Test ${uniqueSuffix}`);
  await createStoreForm.locator('input[name="store_create-image"]').fill('https://picsum.photos/640/360');
  await createStoreForm.locator('input[name="store_create-latitude"]').fill('40.4168');
  await createStoreForm.locator('input[name="store_create-longitude"]').fill('-3.7038');
  await createStoreForm.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/stores\//);
  await expect(page.locator('h2.text-2xl').first()).toContainText(storeName);

  const deleteStoreForm = page.locator('form[action*="/stores/"][action*="/delete"]').first();
  await deleteStoreForm.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/(\?.*)?$/);
  await expect(page.locator(`a[href^="/stores/"]:has-text("${storeName}")`)).toHaveCount(0);
});

test('crud: crear y borrar producto desde la UI', async ({ page }) => {
  const uniqueSuffix = Date.now();
  const productName = `Playwright Product ${uniqueSuffix}`;

  await openHome(page);

  const createProductForm = page.locator('form[action*="/products/create"]');
  await createProductForm.locator('input[name="product_create-name"]').fill(productName);
  await createProductForm.locator('input[name="product_create-size"]').fill('123ml');
  await createProductForm.locator('input[name="product_create-price"]').fill('199');
  await createProductForm.locator('input[name="product_create-image"]').fill('https://picsum.photos/480/480');
  await createProductForm.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/products\//);
  await expect(page.locator('h2.text-2xl').first()).toContainText(productName);

  const deleteProductForm = page.locator('form[action*="/products/"][action*="/delete"]').first();
  await deleteProductForm.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/(\?.*)?$/);
  await expect(page.locator(`a[href^="/products/"]:has-text("${productName}")`)).toHaveCount(0);
});

test('validación: no permite shelfCount mayor que stockCount', async ({ page }) => {
  await openHome(page);

  const firstStoreLink = page.locator('a[href^="/stores/"]').first();
  await firstStoreLink.click();
  await expect(page).toHaveURL(/\/stores\//);

  const inventoryCreateForm = page.locator('form[action*="/inventory/create"]');
  await inventoryCreateForm.locator('input[name="inv_create-stock_count"]').fill('1');
  const shelfCountInput = inventoryCreateForm.locator('input[name="inv_create-shelf_count"]');
  await shelfCountInput.fill('2');
  const currentUrl = page.url();
  await inventoryCreateForm.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(currentUrl);
  await expect(shelfCountInput).toHaveJSProperty(
    'validationMessage',
    'shelfCount must be less than or equal to stockCount.',
  );
});
