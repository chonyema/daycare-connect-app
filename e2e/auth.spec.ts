import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-helpers';

test.describe('Authentication', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DaycareConnect/);
    await expect(page.locator('text=Welcome to DaycareConnect')).toBeVisible();
  });

  test('should open auth modal when clicking Sign In button', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign In / Sign Up")');

    // Should show the auth modal
    await expect(page.locator('text=Welcome Back')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Sign in to your account')).toBeVisible({ timeout: 5000 });
  });

  test('should switch between login and signup views', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign In / Sign Up")');

    // Should be on Sign In by default
    await expect(page.locator('text=Welcome Back')).toBeVisible();

    // Switch to Sign Up
    await page.click('text=Sign Up');
    await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 5000 });
  });

  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign In / Sign Up")');

    // Try to submit empty login form
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Should stay on modal (validation prevents submission)
    await expect(page.locator('text=Welcome Back')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign In / Sign Up")');

    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Should show error message
    await expect(page.locator('text=/invalid.*credentials|incorrect.*password|user.*not.*found/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login as parent', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign In / Sign Up")');

    await page.fill('input[name="email"]', TEST_USERS.parent.email);
    await page.fill('input[name="password"]', TEST_USERS.parent.password);
    await page.click('button[type="submit"]:has-text("Sign In")');

    // Should close modal and show authenticated content
    await expect(page.locator('text=Welcome to DaycareConnect')).toBeHidden({ timeout: 10000 });

    // Should show user interface elements
    await expect(page.locator('text=DaycareConnect').first()).toBeVisible();
  });

  test('should successfully signup as parent', async ({ page }) => {
    const timestamp = Date.now();
    const email = `parent${timestamp}@test.com`;

    await page.goto('/');
    await page.click('button:has-text("Sign In / Sign Up")');

    // Switch to Sign Up
    await page.click('a:has-text("Sign Up")');

    await page.fill('input[name="name"]', 'Test Parent');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');

    // Select parent user type if radio button exists
    const parentRadio = page.locator('input[type="radio"][value="PARENT"]');
    const radioCount = await parentRadio.count();
    if (radioCount > 0) {
      await parentRadio.first().check();
    }

    await page.click('button:has-text("Create Account"), button:has-text("Sign Up")').first();

    // Should close modal and show authenticated content
    await expect(page.locator('text=Welcome to DaycareConnect')).toBeHidden({ timeout: 10000 });
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign In / Sign Up")');

    // Switch to Sign Up
    await page.click('a:has-text("Sign Up")');

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', TEST_USERS.parent.email);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Create Account"), button:has-text("Sign Up")').first();

    // Should show error message
    await expect(page.locator('text=/email.*already.*exists|user.*already.*exists/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.click('button:has-text("Sign In / Sign Up")');

    await page.fill('input[name="email"]', TEST_USERS.parent.email);
    await page.fill('input[name="password"]', TEST_USERS.parent.password);
    await page.click('button:has-text("Sign In")');

    // Wait for authentication
    await expect(page.locator('text=Welcome to DaycareConnect')).toBeHidden({ timeout: 10000 });

    // Find and click logout button (might be in mobile menu or header)
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Log Out")').first();

    // If logout button is in mobile menu, open it first
    if (!await logoutButton.isVisible()) {
      await page.click('button[aria-label="Menu"], button:has(svg)').first();
    }

    await page.click('button:has-text("Logout"), button:has-text("Log Out")');

    // Should show welcome message again
    await expect(page.locator('text=Welcome to DaycareConnect')).toBeVisible({ timeout: 5000 });
  });
});
