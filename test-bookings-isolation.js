// Test that bookings are properly isolated between users
const testBookingsIsolation = async () => {
  const baseUrl = 'http://localhost:3010';

  console.log('🧪 Testing Bookings Isolation...\n');

  try {
    // Test 1: Unauthenticated request should return 401
    console.log('1. Testing unauthenticated access to bookings...');
    const unauthResponse = await fetch(`${baseUrl}/api/bookings`);
    console.log('Unauthenticated response status:', unauthResponse.status);

    if (unauthResponse.status === 401) {
      console.log('✅ Correctly blocks unauthenticated access');
    } else {
      console.log('❌ Should block unauthenticated access');
    }

    // Test 2: Login as Sarah Johnson (Parent) and check bookings
    console.log('\n2. Testing authenticated parent access...');
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'parent@test.com',
        password: 'password123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Parent login successful:', loginData.user?.name);

      // Get the auth cookie
      const cookies = loginResponse.headers.get('set-cookie');

      if (cookies) {
        // Extract auth token from cookie
        const authCookie = cookies.split(';')[0];

        // Test bookings access with authentication
        const bookingsResponse = await fetch(`${baseUrl}/api/bookings`, {
          headers: {
            'Cookie': authCookie
          }
        });

        console.log('Authenticated bookings response status:', bookingsResponse.status);

        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          console.log('✅ Authenticated access successful');
          console.log('User-specific bookings count:', bookingsData.bookings?.length || 0);

          if (bookingsData.bookings) {
            bookingsData.bookings.forEach((booking, index) => {
              console.log(`  ${index + 1}. ${booking.childName} at ${booking.daycare?.name}`);
              console.log(`     Parent ID: ${booking.parentId}`);
              console.log(`     Should match user ID: ${loginData.user.id}`);
              console.log(`     Match: ${booking.parentId === loginData.user.id ? '✅' : '❌'}`);
            });
          }
        } else {
          const errorData = await bookingsResponse.json();
          console.log('❌ Authenticated request failed:', errorData);
        }
      }
    } else {
      console.log('❌ Parent login failed');
    }

    console.log('\n✅ Bookings isolation test completed!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testBookingsIsolation();