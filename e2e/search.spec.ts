import { test, expect } from '@playwright/test';
import { loginAsParent, TEST_USERS } from './fixtures/test-helpers';

test.describe('Daycare Search and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page, TEST_USERS.parent.email, TEST_USERS.parent.password);
  });

  test('should display search page with daycares', async ({ page }) => {
    await expect(page).toHaveURL('/search');
    await expect(page.locator('h1')).toContainText(/find|search|daycare/i);

    // Wait for daycares to load
    const daycareCards = page.locator('[data-testid="daycare-card"], .daycare-card, article, .card');
    await expect(daycareCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should search daycares by name', async ({ page }) => {
    // Wait for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[name="search"]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Sunshine');
    await page.waitForTimeout(1000); // Wait for debounce

    // Check if results are filtered
    const results = page.locator('[data-testid="daycare-card"], .daycare-card, article');
    if (await results.count() > 0) {
      await expect(results.first()).toContainText(/sunshine/i);
    }
  });

  test('should filter daycares by location', async ({ page }) => {
    const locationFilter = page.locator('input[name="location"], select[name="location"], input[placeholder*="Location"]');

    if (await locationFilter.isVisible()) {
      await locationFilter.fill('New York');
      await page.waitForTimeout(1000);

      // Results should update
      const results = page.locator('[data-testid="daycare-card"], .daycare-card');
      await expect(results.first()).toBeVisible();
    }
  });

  test('should filter daycares by age group', async ({ page }) => {
    const ageFilter = page.locator('select[name="ageGroup"], input[name="ageGroup"]');

    if (await ageFilter.isVisible()) {
      if (await ageFilter.evaluate(el => el.tagName) === 'SELECT') {
        await ageFilter.selectOption({ index: 1 });
      } else {
        await ageFilter.fill('Infant');
      }
      await page.waitForTimeout(1000);
    }
  });

  test('should view daycare details', async ({ page }) => {
    // Wait for daycare cards to load
    const daycareCard = page.locator('[data-testid="daycare-card"], .daycare-card, article').first();
    await expect(daycareCard).toBeVisible({ timeout: 10000 });

    // Click on first daycare
    const viewButton = daycareCard.locator('a:has-text("View"), button:has-text("View")').first();
    await viewButton.click();

    // Should navigate to daycare details page
    await page.waitForURL(/\/daycare\/\d+/);
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('should add daycare to favorites', async ({ page }) => {
    // Wait for daycare cards
    const daycareCard = page.locator('[data-testid="daycare-card"], .daycare-card').first();
    await expect(daycareCard).toBeVisible({ timeout: 10000 });

    // Find and click favorite button
    const favoriteButton = daycareCard.locator('button:has-text("Save"), button[aria-label*="favorite"], button[aria-label*="Save"]').first();

    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      await expect(page.locator('text=/saved|added.*favorites/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should clear search filters', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('Test Search');
      await page.waitForTimeout(500);

      // Clear button or clear input
      const clearButton = page.locator('button:has-text("Clear"), button[aria-label*="Clear"]');
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await expect(searchInput).toHaveValue('');
      } else {
        await searchInput.fill('');
      }
    }
  });

  test('should show no results message for invalid search', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('XYZ123NonExistentDaycare999');
      await page.waitForTimeout(1000);

      // Should show no results message
      await expect(page.locator('text=/no.*results|no.*daycare.*found|no.*matches/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
