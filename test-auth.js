// Test authentication with actual users
const testAuth = async () => {
  const baseUrl = 'http://localhost:3002';

  console.log('🔐 Testing Authentication...\n');

  // Test login with Sarah Johnson (Parent)
  console.log('1. Testing login with Sarah Johnson (Parent)...');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'parent@test.com',
        password: 'password123' // Assuming this is the password from seed
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Parent login successful:', loginData.user?.name);

      // Get the auth cookie
      const cookies = loginResponse.headers.get('set-cookie');
      console.log('🍪 Auth cookie received:', cookies ? 'Yes' : 'No');

    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Parent login failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Parent login error:', error.message);
  }

  console.log('\n2. Testing login with Michelle Smith (Provider)...');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'provider1@test.com',
        password: 'password123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Provider login successful:', loginData.user?.name);
    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Provider login failed:', errorData);
    }
  } catch (error) {
    console.log('❌ Provider login error:', error.message);
  }

  console.log('\n📝 To use messaging:');
  console.log('1. Go to http://localhost:3002');
  console.log('2. Login with credentials:');
  console.log('   Parent: parent@test.com / password123');
  console.log('   Provider: provider1@test.com / password123');
  console.log('3. Test messaging between parent and provider');
};

testAuth();