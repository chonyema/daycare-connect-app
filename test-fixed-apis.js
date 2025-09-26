// Test the fixed production APIs
async function testFixedAPIs() {
  const baseUrl = 'https://daycare-connect-fj7od997q-chimere-onyemas-projects.vercel.app';
  
  console.log('Testing fixed production APIs...\n');
  
  // Test daycares list first (should work now)
  console.log('🔍 Testing daycares list...');
  try {
    const daycaresResponse = await fetch(`${baseUrl}/api/daycares`);
    console.log(`Status: ${daycaresResponse.status}`);
    if (daycaresResponse.ok) {
      const daycaresData = await daycaresResponse.json();
      console.log(`✅ Success! Found ${daycaresData.length} daycares\n`);
    } else {
      const errorData = await daycaresResponse.text();
      console.log(`❌ Error: ${errorData}\n`);
    }
  } catch (error) {
    console.error('❌ Daycares API error:', error.message);
  }
  
  console.log('🎯 Now test booking and favorites directly in your browser!');
  console.log(`Production URL: ${baseUrl}`);
}

testFixedAPIs();