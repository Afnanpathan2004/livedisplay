// Quick test script to verify login functionality
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with admin/admin123...');
    
    const response = await axios.post('http://localhost:4000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token ? 'Generated' : 'Missing');
    console.log('User:', response.data.user);
    
    return response.data;
  } catch (error) {
    console.log('❌ Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    
    return null;
  }
}

// Test the login
testLogin().then(result => {
  if (result) {
    console.log('\n🎉 Authentication is working correctly!');
  } else {
    console.log('\n❌ Authentication needs to be fixed.');
  }
  process.exit(0);
});
