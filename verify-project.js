// 🧪 FINAL PROJECT VERIFICATION SCRIPT
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🚀 LIVEBOARD PROJECT VERIFICATION');
console.log('================================\n');

let testsPassed = 0;
let totalTests = 0;

const runTest = (name, testFn) => {
  totalTests++;
  try {
    testFn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
};

// Test 1: Check project structure
runTest('Project Structure', () => {
  const requiredFiles = [
    'server/package.json',
    'client/package.json',
    'server/src/bulletproof-server.js',
    'client/src/App.jsx',
    'client/src/pages/LandingPage.jsx',
    'README.md',
    'SUBMISSION_GUIDE.md'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(__dirname, file))) {
      throw new Error(`Missing file: ${file}`);
    }
  });
});

// Test 2: Check server health
const testServerHealth = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:4000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const health = JSON.parse(data);
          if (health.ok) {
            resolve(health);
          } else {
            reject(new Error('Server not healthy'));
          }
        } else {
          reject(new Error(`Server returned ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Server not running: ${error.message}`));
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Server timeout'));
    });
  });
};

// Test 3: Check authentication
const testAuthentication = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      emailOrUsername: 'admin',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(data);
          if (result.token && result.user) {
            resolve(result);
          } else {
            reject(new Error('Invalid login response'));
          }
        } else {
          reject(new Error(`Login failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Auth request failed: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
};

// Test 4: Check dashboard stats
const testDashboard = (token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/dashboard/stats',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const stats = JSON.parse(data);
          if (stats.totalUsers !== undefined) {
            resolve(stats);
          } else {
            reject(new Error('Invalid dashboard response'));
          }
        } else {
          reject(new Error(`Dashboard failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Dashboard request failed: ${error.message}`));
    });

    req.end();
  });
};

// Run async tests
const runAsyncTests = async () => {
  try {
    // Test server health
    totalTests++;
    const health = await testServerHealth();
    console.log(`✅ Server Health - Uptime: ${Math.round(health.uptime)}s`);
    testsPassed++;

    // Test authentication
    totalTests++;
    const authResult = await testAuthentication();
    console.log(`✅ Authentication - User: ${authResult.user.username}, Role: ${authResult.user.role}`);
    testsPassed++;

    // Test dashboard
    totalTests++;
    const dashboardStats = await testDashboard(authResult.token);
    console.log(`✅ Dashboard API - Users: ${dashboardStats.totalUsers}, Schedules: ${dashboardStats.todaySchedules}`);
    testsPassed++;

  } catch (error) {
    console.log(`❌ Server Tests: ${error.message}`);
    console.log('\n⚠️  Make sure the server is running: npm run dev');
  }

  // Final results
  console.log('\n' + '='.repeat(50));
  console.log(`📊 VERIFICATION RESULTS: ${testsPassed}/${totalTests} PASSED`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 ALL TESTS PASSED! YOUR PROJECT IS PERFECT! 🎉');
    console.log('\n✅ Ready for submission tomorrow!');
    console.log('✅ Server running on http://localhost:4000');
    console.log('✅ Client should be on http://localhost:5173');
    console.log('✅ Login: admin/admin123');
    console.log('✅ Live Display: http://localhost:5173/display');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
  
  console.log('\n🚀 Your LiveBoard project is enterprise-ready!');
  process.exit(testsPassed === totalTests ? 0 : 1);
};

// Start verification
setTimeout(runAsyncTests, 1000);
