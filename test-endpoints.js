// Quick test to verify public endpoints work
const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

async function testEndpoints() {
  console.log('🧪 Testing LiveBoard Endpoints...\n');

  // Test 1: Health Check
  try {
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health Check:', health.data);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    console.log('⚠️  Backend server is not running on port 4000!');
    console.log('   Run: cd server && npm run dev\n');
    return;
  }

  // Test 2: Public Schedule Endpoint (NO AUTH)
  try {
    const schedule = await axios.get(`${BASE_URL}/api/schedule`);
    console.log('✅ Schedule Endpoint (Public):', schedule.data.length, 'schedules found');
  } catch (error) {
    console.log('❌ Schedule Endpoint Failed:', error.response?.status, error.response?.data?.error || error.message);
  }

  // Test 3: Public Announcements Endpoint (NO AUTH)
  try {
    const announcements = await axios.get(`${BASE_URL}/api/announcements`);
    console.log('✅ Announcements Endpoint (Public):', announcements.data.length, 'announcements found');
  } catch (error) {
    console.log('❌ Announcements Endpoint Failed:', error.response?.status, error.response?.data?.error || error.message);
  }

  // Test 4: Protected Dashboard Endpoint (REQUIRES AUTH)
  try {
    const dashboard = await axios.get(`${BASE_URL}/api/dashboard/stats`);
    console.log('❌ Dashboard Endpoint should require auth but didn\'t!');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Dashboard Endpoint (Protected): Correctly requires authentication');
    } else {
      console.log('❌ Dashboard Endpoint Failed:', error.message);
    }
  }

  console.log('\n🎉 All tests completed!\n');
  console.log('Next steps:');
  console.log('1. Clear browser cache (Ctrl+Shift+Delete)');
  console.log('2. Or use Incognito mode');
  console.log('3. Visit: http://localhost:5173/display');
  console.log('4. Should work without login!\n');
}

testEndpoints().catch(console.error);
