import { test, expect } from '@playwright/test';

test.describe('Attendance API Tests', () => {
  let authCookie: string;
  let daycareId: string;
  let bookingId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth cookie
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'provider1@test.com',
        password: 'password123',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const cookies = await loginResponse.headersArray();
    const setCookieHeader = cookies.find(h => h.name.toLowerCase() === 'set-cookie');
    if (setCookieHeader) {
      authCookie = setCookieHeader.value;
    }

    // Get provider's daycares
    const daycaresResponse = await request.get('/api/provider/daycares');
    const daycaresData = await daycaresResponse.json();

    if (daycaresData && daycaresData.length > 0) {
      daycareId = daycaresData[0].id;
    }

    // Get a booking
    const bookingsResponse = await request.get('/api/bookings');
    const bookingsData = await bookingsResponse.json();

    if (bookingsData.success && bookingsData.bookings && bookingsData.bookings.length > 0) {
      // Find a PENDING or CONFIRMED booking
      const validBooking = bookingsData.bookings.find(
        (b: any) => b.status === 'PENDING' || b.status === 'CONFIRMED'
      );
      if (validBooking) {
        bookingId = validBooking.id;
      }
    }
  });

  test('should check in a child via API', async ({ request }) => {
    test.skip(!bookingId, 'No valid booking found');

    const response = await request.post('/api/attendance/check-in', {
      data: {
        bookingId,
        temperature: 98.6,
        mood: 'Happy',
        checkInNotes: 'Playwright test check-in',
        emergencyContact: '555-TEST',
      },
    });

    const data = await response.json();

    console.log('Check-in response:', JSON.stringify(data, null, 2));

    // Should either succeed or say already checked in
    if (response.ok()) {
      expect(data.success).toBeTruthy();
      expect(data.attendance).toBeDefined();
      expect(data.attendance.status).toBe('CHECKED_IN');
      expect(data.attendance.temperature).toBe(98.6);
      expect(data.attendance.mood).toBe('Happy');
    } else {
      // If already checked in, that's also acceptable
      expect(data.error).toContain('already checked in');
    }
  });

  test('should fetch today\'s attendance', async ({ request }) => {
    test.skip(!daycareId, 'No daycare ID found');

    const response = await request.get(`/api/attendance/today?daycareId=${daycareId}`);
    const data = await response.json();

    console.log('Today attendance:', JSON.stringify(data, null, 2));

    expect(response.ok()).toBeTruthy();
    expect(data.success).toBeTruthy();
    expect(data.summary).toBeDefined();
    expect(data.summary.total).toBeGreaterThanOrEqual(0);
    expect(data.summary.checkedIn).toBeGreaterThanOrEqual(0);
    expect(data.summary.checkedOut).toBeGreaterThanOrEqual(0);
    expect(data.attendance).toBeDefined();
    expect(data.attendance.checkedIn).toBeDefined();
    expect(data.attendance.checkedOut).toBeDefined();
  });

  test('should fetch attendance history', async ({ request }) => {
    test.skip(!daycareId, 'No daycare ID found');

    const response = await request.get(`/api/attendance?daycareId=${daycareId}`);
    const data = await response.json();

    console.log(`Found ${data.attendance?.length || 0} attendance records`);

    expect(response.ok()).toBeTruthy();
    expect(data.success).toBeTruthy();
    expect(Array.isArray(data.attendance)).toBeTruthy();

    if (data.attendance.length > 0) {
      const record = data.attendance[0];
      expect(record.id).toBeDefined();
      expect(record.childName).toBeDefined();
      expect(record.checkInTime).toBeDefined();
      expect(record.status).toBeDefined();
      console.log('Sample record:', {
        child: record.childName,
        checkIn: record.checkInTime,
        checkOut: record.checkOutTime,
        status: record.status,
        hours: record.totalHours,
      });
    }
  });

  test('should check out a child via API', async ({ request }) => {
    // First, get today's checked-in children
    test.skip(!daycareId, 'No daycare ID found');

    const todayResponse = await request.get(`/api/attendance/today?daycareId=${daycareId}`);
    const todayData = await todayResponse.json();

    if (todayData.attendance.checkedIn && todayData.attendance.checkedIn.length > 0) {
      const checkedInRecord = todayData.attendance.checkedIn[0];

      const checkOutResponse = await request.post('/api/attendance/check-out', {
        data: {
          attendanceId: checkedInRecord.id,
          checkOutNotes: 'Playwright test check-out',
        },
      });

      const checkOutData = await checkOutResponse.json();

      console.log('Check-out response:', JSON.stringify(checkOutData, null, 2));

      expect(checkOutResponse.ok()).toBeTruthy();
      expect(checkOutData.success).toBeTruthy();
      expect(checkOutData.attendance.status).toMatch(/CHECKED_OUT|LATE/);
      expect(checkOutData.attendance.checkOutTime).toBeDefined();
      expect(checkOutData.totalHours).toBeGreaterThan(0);
    } else {
      test.skip(true, 'No checked-in children to check out');
    }
  });

  test('should prevent duplicate check-ins', async ({ request }) => {
    test.skip(!bookingId, 'No valid booking found');

    // Try to check in twice
    await request.post('/api/attendance/check-in', {
      data: {
        bookingId,
        temperature: 98.6,
        mood: 'Happy',
        checkInNotes: 'First check-in',
      },
    });

    // Try again
    const secondResponse = await request.post('/api/attendance/check-in', {
      data: {
        bookingId,
        temperature: 97.5,
        mood: 'Energetic',
        checkInNotes: 'Duplicate check-in attempt',
      },
    });

    const data = await secondResponse.json();

    console.log('Duplicate check-in response:', data);

    expect(secondResponse.status()).toBe(400);
    expect(data.error).toContain('already checked in');
  });
});
