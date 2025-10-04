import { test, expect } from '@playwright/test';

test.describe('Waitlist Offer Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('Provider can view and manage waitlist offers', async ({ page }) => {
    // Sign in as provider
    await page.getByRole('button', { name: /sign in/i }).first().click();
    await page.waitForSelector('text=Welcome Back');

    await page.fill('input[type="email"]', 'provider@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Wait for authentication
    await page.waitForTimeout(2000);

    // Switch to provider view
    await page.getByRole('button', { name: /provider view/i }).click();
    await page.waitForTimeout(1000);

    // Navigate to waitlist tab
    await page.getByRole('button', { name: /waitlist/i }).click();
    await page.waitForTimeout(1000);

    // Check if we can see the waitlist management tabs
    const waitlistEntriesTab = page.getByRole('button', { name: /waitlist entries/i });
    const spotOffersTab = page.getByRole('button', { name: /spot offers/i });

    await expect(waitlistEntriesTab).toBeVisible();
    await expect(spotOffersTab).toBeVisible();

    // Click on Spot Offers tab
    await spotOffersTab.click();
    await page.waitForTimeout(1000);

    // Verify offer management interface is visible
    const offerManagerHeading = page.getByText(/waitlist offers/i);
    await expect(offerManagerHeading).toBeVisible();

    // Check for create offer button
    const createOfferButton = page.getByRole('button', { name: /create offer/i });
    await expect(createOfferButton).toBeVisible();

    console.log('✓ Provider can access waitlist offer management');
  });

  test('Parent can view waitlist position tracker', async ({ page }) => {
    // Sign in as parent
    await page.getByRole('button', { name: /sign in/i }).first().click();
    await page.waitForSelector('text=Welcome Back');

    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    // Wait for authentication
    await page.waitForTimeout(2000);

    // Navigate to waitlist section
    await page.getByRole('button', { name: /waitlist/i }).click();
    await page.waitForTimeout(1000);

    // Check if we can see the position tracker tab
    const positionTrackerTab = page.getByRole('button', { name: /position tracker/i });
    const manageEntriesTab = page.getByRole('button', { name: /manage entries/i });

    await expect(positionTrackerTab).toBeVisible();
    await expect(manageEntriesTab).toBeVisible();

    // Position tracker should be default tab
    const trackerHeading = page.getByText(/my waitlist positions/i);
    await expect(trackerHeading).toBeVisible();

    console.log('✓ Parent can access waitlist position tracker');
  });

  test('Parent can switch between position tracker and manage entries', async ({ page }) => {
    // Sign in as parent
    await page.getByRole('button', { name: /sign in/i }).first().click();
    await page.waitForSelector('text=Welcome Back');

    await page.fill('input[type="email"]', 'parent@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.waitForTimeout(2000);

    // Navigate to waitlist section
    await page.getByRole('button', { name: /waitlist/i }).click();
    await page.waitForTimeout(1000);

    // Should start on position tracker
    await expect(page.getByText(/my waitlist positions/i)).toBeVisible();

    // Switch to manage entries
    await page.getByRole('button', { name: /manage entries/i }).click();
    await page.waitForTimeout(500);

    // Should see manage entries content
    await expect(page.getByText(/my waitlists/i)).toBeVisible();

    // Switch back to position tracker
    await page.getByRole('button', { name: /position tracker/i }).click();
    await page.waitForTimeout(500);

    // Should see position tracker again
    await expect(page.getByText(/my waitlist positions/i)).toBeVisible();

    console.log('✓ Parent can switch between tabs successfully');
  });

  test('Provider can switch between waitlist entries and spot offers', async ({ page }) => {
    // Sign in as provider
    await page.getByRole('button', { name: /sign in/i }).first().click();
    await page.waitForSelector('text=Welcome Back');

    await page.fill('input[type="email"]', 'provider@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.waitForTimeout(2000);

    // Switch to provider view
    await page.getByRole('button', { name: /provider view/i }).click();
    await page.waitForTimeout(1000);

    // Navigate to waitlist tab
    await page.getByRole('button', { name: /waitlist/i }).click();
    await page.waitForTimeout(1000);

    // Should start on waitlist entries
    await expect(page.getByText(/waitlist management/i)).toBeVisible();

    // Switch to spot offers
    await page.getByRole('button', { name: /spot offers/i }).click();
    await page.waitForTimeout(500);

    // Should see offer management
    await expect(page.getByText(/waitlist offers/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create offer/i })).toBeVisible();

    // Switch back to waitlist entries
    await page.getByRole('button', { name: /waitlist entries/i }).click();
    await page.waitForTimeout(500);

    // Should see waitlist management again
    await expect(page.getByText(/waitlist management/i)).toBeVisible();

    console.log('✓ Provider can switch between tabs successfully');
  });
});
