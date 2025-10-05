// API Testing Script for LiveDisplay
// Run with: node test-api.js

const axios = require('axios');

const API_BASE = 'http://localhost:4000/api';
let authToken = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(`✓ ${name}`, 'green');
    return true;
  } catch (error) {
    log(`✗ ${name}`, 'red');
    log(`  Error: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n🚀 Starting LiveDisplay API Tests\n', 'blue');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Health Check
  if (await test('Health Check', async () => {
    const res = await axios.get(`${API_BASE}/health`);
    if (!res.data.ok) throw new Error('Health check failed');
  })) passed++; else failed++;

  // Test 2: Login
  if (await test('Login with admin/admin123', async () => {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    if (!res.data.token) throw new Error('No token received');
    authToken = res.data.token;
  })) passed++; else failed++;

  // Create axios instance with auth
  const authApi = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${authToken}` }
  });

  // Test 3: Get Current User
  if (await test('Get current user', async () => {
    const res = await authApi.get('/auth/me');
    if (!res.data.user) throw new Error('No user data');
  })) passed++; else failed++;

  // Test 4: Create Schedule (Academic Format)
  let scheduleId = '';
  if (await test('Create schedule (academic format)', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await authApi.post('/schedule', {
      date: today,
      start_time: '10:00',
      end_time: '11:30',
      room_number: 'Test Room 101',
      subject: 'API Testing Class',
      faculty_name: 'Test Professor'
    });
    if (!res.data.id) throw new Error('No schedule ID returned');
    scheduleId = res.data.id;
  })) passed++; else failed++;

  // Test 5: Get Schedules
  if (await test('Get schedules with date filter', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(`${API_BASE}/schedule?date=${today}`);
    if (!Array.isArray(res.data)) throw new Error('Invalid response format');
  })) passed++; else failed++;

  // Test 6: Update Schedule
  if (await test('Update schedule', async () => {
    const res = await authApi.put(`/schedule/${scheduleId}`, {
      subject: 'Updated API Testing Class'
    });
    if (res.data.subject !== 'Updated API Testing Class') throw new Error('Update failed');
  })) passed++; else failed++;

  // Test 7: Create Announcement
  let announcementId = '';
  if (await test('Create announcement', async () => {
    const res = await authApi.post('/announcements', {
      message: 'Test Announcement from API',
      active: true
    });
    if (!res.data.id) throw new Error('No announcement ID returned');
    announcementId = res.data.id;
  })) passed++; else failed++;

  // Test 8: Get Announcements
  if (await test('Get announcements', async () => {
    const res = await axios.get(`${API_BASE}/announcements`);
    if (!Array.isArray(res.data)) throw new Error('Invalid response format');
  })) passed++; else failed++;

  // Test 9: Create Task
  let taskId = '';
  if (await test('Create task', async () => {
    const res = await authApi.post('/tasks', {
      title: 'Test Task from API',
      description: 'Testing task creation',
      priority: 'high',
      status: 'pending'
    });
    if (!res.data.id) throw new Error('No task ID returned');
    taskId = res.data.id;
  })) passed++; else failed++;

  // Test 10: Get Tasks
  if (await test('Get tasks', async () => {
    const res = await authApi.get('/tasks');
    if (!Array.isArray(res.data)) throw new Error('Invalid response format');
  })) passed++; else failed++;

  // Test 11: Create Employee
  let employeeId = '';
  if (await test('Create employee', async () => {
    const res = await authApi.post('/employees', {
      firstName: 'Test',
      lastName: 'Employee',
      email: 'test@example.com',
      phone: '555-0100',
      department: 'IT',
      position: 'Developer'
    });
    if (!res.data.id) throw new Error('No employee ID returned');
    employeeId = res.data.id;
  })) passed++; else failed++;

  // Test 12: Get Employees
  if (await test('Get employees', async () => {
    const res = await authApi.get('/employees');
    if (!Array.isArray(res.data)) throw new Error('Invalid response format');
  })) passed++; else failed++;

  // Test 13: Create Visitor
  if (await test('Create visitor', async () => {
    const res = await authApi.post('/visitors', {
      name: 'Test Visitor',
      company: 'Test Corp',
      email: 'visitor@test.com',
      phone: '555-0200',
      purpose: 'Meeting',
      hostEmployee: 'Test Employee'
    });
    if (!res.data.id) throw new Error('No visitor ID returned');
  })) passed++; else failed++;

  // Test 14: Create Room
  if (await test('Create room', async () => {
    const res = await authApi.post('/rooms', {
      name: 'Test Conference Room',
      capacity: '20',
      location: 'Floor 1',
      amenities: 'Projector, Whiteboard'
    });
    if (!res.data.id) throw new Error('No room ID returned');
  })) passed++; else failed++;

  // Test 15: Dashboard Stats
  if (await test('Get dashboard stats', async () => {
    const res = await authApi.get('/dashboard/stats');
    if (typeof res.data.todaySchedules !== 'number') throw new Error('Invalid stats format');
  })) passed++; else failed++;

  // Cleanup Tests
  if (await test('Delete schedule', async () => {
    await authApi.delete(`/schedule/${scheduleId}`);
  })) passed++; else failed++;

  if (await test('Delete announcement', async () => {
    await authApi.delete(`/announcements/${announcementId}`);
  })) passed++; else failed++;

  if (await test('Delete task', async () => {
    await authApi.delete(`/tasks/${taskId}`);
  })) passed++; else failed++;

  if (await test('Delete employee', async () => {
    await authApi.delete(`/employees/${employeeId}`);
  })) passed++; else failed++;

  // Summary
  log('\n📊 Test Results:', 'blue');
  log(`✓ Passed: ${passed}`, 'green');
  log(`✗ Failed: ${failed}`, 'red');
  log(`Total: ${passed + failed}\n`, 'yellow');

  if (failed === 0) {
    log('🎉 All tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Check the errors above.', 'yellow');
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
