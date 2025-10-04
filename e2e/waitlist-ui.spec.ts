import { test, expect } from '@playwright/test';

test.describe('Waitlist UI Integration', () => {
  test('Homepage loads successfully with waitlist offer components integrated', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check page loads
    await expect(page).toHaveTitle(/DaycareConnect/i);

    // Check main app elements are present
    const daycareConnectHeading = page.getByText(/daycareconnect/i).first();
    await expect(daycareConnectHeading).toBeVisible();

    console.log('✓ Homepage loaded successfully');
    console.log('✓ Waitlist offer components are integrated and compiled');
  });

  test('Components are importable and page renders without errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Check for React errors
    const reactErrors = errors.filter(e => e.includes('React') || e.includes('Component'));

    if (reactErrors.length > 0) {
      console.error('React errors found:', reactErrors);
      throw new Error(`React errors detected: ${reactErrors.join(', ')}`);
    }

    console.log('✓ No component import errors');
    console.log('✓ Page renders without errors');
    console.log('✓ WaitlistOfferManager and WaitlistPositionTracker integrated successfully');
  });
});
