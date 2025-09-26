// Test signup API functionality
const testSignup = async () => {
  const baseUrl = 'http://localhost:3004'; // Updated port

  console.log('🧪 Testing Signup API...\n');

  try {
    // Test signup with valid data
    console.log('1. Testing signup with valid data...');

    const signupData = {
      name: 'New Test User',
      email: `test.user.${Date.now()}@example.com`, // Unique email
      password: 'password123',
      userType: 'PARENT',
      phone: '555-123-4567'
    };

    console.log('Sending signup request to:', `${baseUrl}/api/auth/signup`);
    console.log('Request data:', { ...signupData, password: '***' });

    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    try {
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('✅ Signup successful!');
        console.log('User created:', data.user?.name);
      } else {
        console.log('❌ Signup failed:', data.message);
      }
    } catch (jsonError) {
      console.log('❌ Failed to parse JSON response:', jsonError.message);
      const text = await response.text();
      console.log('Raw response:', text);
    }

  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n2. Testing if server is responsive...');
  try {
    const healthCheck = await fetch(`${baseUrl}/api/daycares`);
    console.log('Health check status:', healthCheck.status);
    console.log('✅ Server is responsive');
  } catch (error) {
    console.log('❌ Server not responsive:', error.message);
  }
};

testSignup();