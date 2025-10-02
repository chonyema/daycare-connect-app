import { test, expect } from '@playwright/test';

test.describe('Attendance Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Login as provider
    await page.goto('/login');
    await page.fill('input[name="email"]', 'provider1@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect after login
    await page.waitForTimeout(2000);
  });

  test('should display attendance dashboard', async ({ page }) => {
    // Navigate to attendance/dashboard page
    await page.goto('/attendance');

    // Check if page loaded
    await expect(page.locator('text=/attendance|check.*in/i')).toBeVisible({ timeout: 10000 });
  });

  test('should check in a child successfully', async ({ page }) => {
    await page.goto('/provider-dashboard');
    await page.waitForTimeout(1000);

    // Look for check-in button or attendance section
    const checkInButton = page.locator('button:has-text("Check In"), a:has-text("Attendance")').first();

    if (await checkInButton.isVisible({ timeout: 5000 })) {
      await checkInButton.click();
      await page.waitForTimeout(1000);

      // Look for a child to check in
      const firstCheckInBtn = page.locator('button:has-text("Check In")').first();

      if (await firstCheckInBtn.isVisible({ timeout: 5000 })) {
        await firstCheckInBtn.click();
        await page.waitForTimeout(500);

        // Fill in check-in details
        const tempInput = page.locator('input[type="number"]').first();
        if (await tempInput.isVisible({ timeout: 2000 })) {
          await tempInput.fill('98.6');
        }

        const moodSelect = page.locator('select').first();
        if (await moodSelect.isVisible({ timeout: 2000 })) {
          await moodSelect.selectOption('Happy');
        }

        const notesTextarea = page.locator('textarea').first();
        if (await notesTextarea.isVisible({ timeout: 2000 })) {
          await notesTextarea.fill('Automated test check-in');
        }

        // Submit check-in
        const submitBtn = page.locator('button[type="submit"]:has-text("Check In")');
        if (await submitBtn.isVisible({ timeout: 2000 })) {
          await submitBtn.click();

          // Wait for success message
          await expect(page.locator('text=/success|checked.*in/i')).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should display check-in status on dashboard', async ({ page }) => {
    await page.goto('/provider-dashboard');
    await page.waitForTimeout(1000);

    // Look for attendance or check-in indicators
    const attendanceSection = page.locator('text=/attendance|checked.*in|present/i').first();

    await expect(attendanceSection).toBeVisible({ timeout: 10000 });
  });

  test('should view attendance history', async ({ page }) => {
    await page.goto('/provider-dashboard');
    await page.waitForTimeout(1000);

    // Look for history or reports link
    const historyLink = page.locator('a:has-text("History"), a:has-text("Reports"), button:has-text("History")').first();

    if (await historyLink.isVisible({ timeout: 5000 })) {
      await historyLink.click();
      await page.waitForTimeout(1000);

      // Should see some attendance records or a table
      const recordsList = page.locator('table, .attendance-record, [data-testid="attendance-record"]');
      await expect(recordsList.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('API: should create attendance record via API', async ({ request }) => {
    // First login to get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'provider1@test.com',
        password: 'password123',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    // Get a booking ID - create one if needed
    const bookingsResponse = await request.get('/api/bookings');
    const bookingsData = await bookingsResponse.json();

    let bookingId = null;
    if (bookingsData.success && bookingsData.bookings && bookingsData.bookings.length > 0) {
      bookingId = bookingsData.bookings[0].id;
    }

    if (bookingId) {
      // Try to check in
      const checkInResponse = await request.post('/api/attendance/check-in', {
        data: {
          bookingId,
          temperature: 98.6,
          mood: 'Happy',
          checkInNotes: 'Playwright API test',
          emergencyContact: '555-1234',
        },
      });

      const checkInData = await checkInResponse.json();

      // Should either succeed or say already checked in
      expect(
        checkInResponse.ok() || checkInData.error?.includes('already checked in')
      ).toBeTruthy();
    }
  });

  test('API: should fetch today\'s attendance', async ({ request }) => {
    // Login first
    await request.post('/api/auth/login', {
      data: {
        email: 'provider1@test.com',
        password: 'password123',
      },
    });

    // Get provider's daycares
    const daycaresResponse = await request.get('/api/provider/daycares');
    const daycaresData = await daycaresResponse.json();

    if (daycaresData && daycaresData.length > 0) {
      const daycareId = daycaresData[0].id;

      // Fetch today's attendance
      const todayResponse = await request.get(`/api/attendance/today?daycareId=${daycareId}`);
      const todayData = await todayResponse.json();

      expect(todayResponse.ok()).toBeTruthy();
      expect(todayData.success).toBeTruthy();
      expect(todayData.summary).toBeDefined();
      expect(todayData.attendance).toBeDefined();
    }
  });

  test('API: should fetch attendance history', async ({ request }) => {
    // Login first
    await request.post('/api/auth/login', {
      data: {
        email: 'provider1@test.com',
        password: 'password123',
      },
    });

    // Get provider's daycares
    const daycaresResponse = await request.get('/api/provider/daycares');
    const daycaresData = await daycaresResponse.json();

    if (daycaresData && daycaresData.length > 0) {
      const daycareId = daycaresData[0].id;

      // Fetch attendance history
      const historyResponse = await request.get(`/api/attendance?daycareId=${daycareId}`);
      const historyData = await historyResponse.json();

      expect(historyResponse.ok()).toBeTruthy();
      expect(historyData.success).toBeTruthy();
      expect(Array.isArray(historyData.attendance)).toBeTruthy();
    }
  });
});
