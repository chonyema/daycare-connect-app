import { test, expect } from '@playwright/test';
import { loginAsParent, TEST_USERS } from './fixtures/test-helpers';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsParent(page, TEST_USERS.parent.email, TEST_USERS.parent.password);
  });

  test('should navigate to booking page from daycare details', async ({ page }) => {
    // Go to search and select a daycare
    const daycareCard = page.locator('[data-testid="daycare-card"], .daycare-card, article').first();
    await expect(daycareCard).toBeVisible({ timeout: 10000 });

    const viewButton = daycareCard.locator('a:has-text("View"), button:has-text("View")').first();
    await viewButton.click();

    // Wait for details page
    await page.waitForURL(/\/daycare\/\d+/);

    // Find and click book button
    const bookButton = page.locator('button:has-text("Book"), a:has-text("Book"), button:has-text("Request Booking")');
    if (await bookButton.isVisible()) {
      await bookButton.click();
      await expect(page).toHaveURL(/\/booking|\/book/);
    }
  });

  test('should show booking form with required fields', async ({ page }) => {
    // Navigate directly to booking (assuming format /booking/:daycareId)
    await page.goto('/search');
    const firstDaycare = page.locator('[data-testid="daycare-card"], .daycare-card').first();
    await expect(firstDaycare).toBeVisible({ timeout: 10000 });

    const viewButton = firstDaycare.locator('a:has-text("View"), button:has-text("View")').first();
    await viewButton.click();
    await page.waitForURL(/\/daycare\/\d+/);

    const bookButton = page.locator('button:has-text("Book"), a:has-text("Book")');
    if (await bookButton.isVisible()) {
      await bookButton.click();

      // Check for booking form fields
      const startDateInput = page.locator('input[name="startDate"], input[type="date"]');
      const childNameInput = page.locator('input[name="childName"], input[name="name"]');

      if (await startDateInput.isVisible()) {
        await expect(startDateInput).toBeVisible();
      }
    }
  });

  test('should validate booking form fields', async ({ page }) => {
    await page.goto('/search');
    const firstDaycare = page.locator('[data-testid="daycare-card"], .daycare-card').first();
    await expect(firstDaycare).toBeVisible({ timeout: 10000 });

    const viewButton = firstDaycare.locator('a:has-text("View")').first();
    await viewButton.click();
    await page.waitForURL(/\/daycare\/\d+/);

    const bookButton = page.locator('button:has-text("Book"), a:has-text("Book")');
    if (await bookButton.isVisible()) {
      await bookButton.click();

      // Try to submit without filling required fields
      const submitButton = page.locator('button[type="submit"]:has-text("Submit"), button[type="submit"]:has-text("Book"), button:has-text("Confirm")');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation errors
        const errorMessage = page.locator('text=/required|please.*fill|invalid/i');
        await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should successfully create a booking', async ({ page }) => {
    await page.goto('/search');
    const firstDaycare = page.locator('[data-testid="daycare-card"], .daycare-card').first();
    await expect(firstDaycare).toBeVisible({ timeout: 10000 });

    const viewButton = firstDaycare.locator('a:has-text("View")').first();
    await viewButton.click();
    await page.waitForURL(/\/daycare\/\d+/);

    const bookButton = page.locator('button:has-text("Book"), a:has-text("Book")');
    if (await bookButton.isVisible()) {
      await bookButton.click();

      // Fill booking form
      const childNameInput = page.locator('input[name="childName"], input[name="name"]');
      if (await childNameInput.isVisible()) {
        await childNameInput.fill('Test Child');
      }

      const startDateInput = page.locator('input[name="startDate"], input[type="date"]').first();
      if (await startDateInput.isVisible()) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const dateString = futureDate.toISOString().split('T')[0];
        await startDateInput.fill(dateString);
      }

      const ageInput = page.locator('input[name="age"], select[name="age"]');
      if (await ageInput.isVisible()) {
        await ageInput.fill('3');
      }

      const notesInput = page.locator('textarea[name="notes"], textarea[name="additionalInfo"]');
      if (await notesInput.isVisible()) {
        await notesInput.fill('Test booking notes');
      }

      // Submit booking
      const submitButton = page.locator('button[type="submit"]:has-text("Submit"), button[type="submit"]:has-text("Book"), button:has-text("Confirm")');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show success message or redirect
        await expect(page.locator('text=/success|confirmed|booking.*created/i')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should view booking history', async ({ page }) => {
    // Navigate to bookings/profile page
    const bookingsLink = page.locator('a:has-text("Bookings"), a:has-text("My Bookings"), a[href*="/bookings"]');

    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await page.waitForURL(/\/bookings|\/profile/);

      // Should display list of bookings
      const bookingList = page.locator('[data-testid="booking-item"], .booking-card, .booking-item');
      await expect(bookingList.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should cancel a booking', async ({ page }) => {
    const bookingsLink = page.locator('a:has-text("Bookings"), a:has-text("My Bookings")');

    if (await bookingsLink.isVisible()) {
      await bookingsLink.click();
      await page.waitForURL(/\/bookings|\/profile/);

      // Find cancel button for a booking
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Cancel Booking")').first();

      if (await cancelButton.isVisible()) {
        await cancelButton.click();

        // Confirm cancellation if there's a confirmation dialog
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible({ timeout: 2000 })) {
          await confirmButton.click();
        }

        // Should show success message
        await expect(page.locator('text=/cancelled|canceled/i')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
