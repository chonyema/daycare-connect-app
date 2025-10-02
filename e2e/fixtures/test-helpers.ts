import { Page } from '@playwright/test';

/**
 * Test helper functions for common operations
 */

export async function loginAsParent(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/search');
}

export async function loginAsProvider(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/provider-dashboard');
}

export async function logout(page: Page) {
  await page.click('button:has-text("Logout")');
  await page.waitForURL('/');
}

export const TEST_USERS = {
  parent: {
    email: 'parent@test.com',
    password: 'password123',
    name: 'Test Parent',
  },
  provider: {
    email: 'provider@test.com',
    password: 'password123',
    name: 'Test Provider',
  },
};
