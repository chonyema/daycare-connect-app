import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures/test-helpers';

test.describe('Authentication', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DaycareConnect/);
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL('/signup');
    await expect(page.locator('h1')).toContainText(/sign up|create account/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText(/log in|sign in/i);
  });

  test('should show validation errors for empty signup form', async ({ page }) => {
    await page.goto('/signup');
    await page.click('button[type="submit"]');

    // Check for validation messages
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    await expect(emailInput).toBeFocused();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');

    // Should show validation error or stay on page
    await expect(page).toHaveURL('/signup');
  });

  test('should successfully signup as parent', async ({ page }) => {
    const timestamp = Date.now();
    const email = `parent${timestamp}@test.com`;

    await page.goto('/signup');
    await page.fill('input[name="name"]', 'Test Parent');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'password123');

    // Select parent user type
    const parentRadio = page.locator('input[type="radio"][value="PARENT"]');
    if (await parentRadio.isVisible()) {
      await parentRadio.check();
    }

    await page.click('button[type="submit"]');

    // Should redirect to search page or login page
    await page.waitForURL(/\/(search|login)/);
  });

  test('should show error for duplicate email', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', TEST_USERS.parent.email);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/email.*already.*exists|user.*already.*exists/i')).toBeVisible({ timeout: 5000 });
  });

  test('should successfully login as parent', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USERS.parent.email);
    await page.fill('input[name="password"]', TEST_USERS.parent.password);
    await page.click('button[type="submit"]');

    // Should redirect to search page
    await page.waitForURL('/search', { timeout: 10000 });
    await expect(page).toHaveURL('/search');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=/invalid.*credentials|incorrect.*password|user.*not.*found/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', TEST_USERS.parent.email);
    await page.fill('input[name="password"]', TEST_USERS.parent.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/search');

    // Logout
    await page.click('button:has-text("Logout"), a:has-text("Logout")');

    // Should redirect to homepage
    await page.waitForURL('/');
    await expect(page).toHaveURL('/');
  });
});
