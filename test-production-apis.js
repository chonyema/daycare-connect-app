// Test production API endpoints
async function testAPIs() {
  const baseUrl = 'https://daycare-connect-hny7vm7o6-chimere-onyemas-projects.vercel.app';
  
  console.log('Testing production APIs...\n');
  
  // Test booking API
  console.log('🔍 Testing booking creation...');
  try {
    const bookingResponse = await fetch(`${baseUrl}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: 'test-parent-id',
        daycareId: 'test-daycare-id', 
        childName: 'Test Child',
        childAge: '3',
        startDate: new Date().toISOString(),
        careType: 'FULL_TIME',
        dailyRate: 50
      })
    });
    
    console.log(`Status: ${bookingResponse.status}`);
    const bookingData = await bookingResponse.text();
    console.log(`Response: ${bookingData}\n`);
    
  } catch (error) {
    console.error('❌ Booking API error:', error.message);
  }
  
  // Test favorites API
  console.log('🔍 Testing favorites...');
  try {
    const favoritesResponse = await fetch(`${baseUrl}/api/favorites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        daycareId: 'test-daycare-id'
      })
    });
    
    console.log(`Status: ${favoritesResponse.status}`);
    const favoritesData = await favoritesResponse.text();
    console.log(`Response: ${favoritesData}\n`);
    
  } catch (error) {
    console.error('❌ Favorites API error:', error.message);
  }
  
  // Test daycares API (should work)
  console.log('🔍 Testing daycares list...');
  try {
    const daycaresResponse = await fetch(`${baseUrl}/api/daycares`);
    console.log(`Status: ${daycaresResponse.status}`);
    const daycaresData = await daycaresResponse.text();
    console.log(`Response length: ${daycaresData.length} characters`);
    console.log(`First 200 chars: ${daycaresData.substring(0, 200)}...\n`);
    
  } catch (error) {
    console.error('❌ Daycares API error:', error.message);
  }
}

testAPIs();