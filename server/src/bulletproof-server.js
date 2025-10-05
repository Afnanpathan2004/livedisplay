// 🚀 BULLETPROOF LIVEBOARD SERVER - ZERO DEPENDENCY ISSUES
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Initialize environment
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-liveboard';

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 🔧 MIDDLEWARE SETUP
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 💾 IN-MEMORY DATABASE (PERFECT FOR DEMO/SUBMISSION)
const users = new Map();
const schedules = new Map();
const announcements = new Map();
const tasks = new Map();

// 🔐 AUTHENTICATION UTILITIES
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// 🏥 HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    users: users.size,
    schedules: schedules.size,
    announcements: announcements.size,
    tasks: tasks.size
  });
});

// 🔐 AUTHENTICATION ROUTES
app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrUsername, username, password } = req.body;
    const identifier = emailOrUsername || username;
    
    if (!identifier || !password) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: [{ field: 'emailOrUsername', message: 'Username and password are required' }]
      });
    }
    
    // Find user
    let user = null;
    for (const [id, u] of users) {
      if (u.username === identifier || u.email === identifier) {
        user = u;
        break;
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = 'viewer' } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if user exists
    for (const [id, user] of users) {
      if (user.username === username || user.email === email) {
        return res.status(409).json({ error: 'User already exists' });
      }
    }
    
    const userId = Date.now().toString();
    const passwordHash = await hashPassword(password);
    
    const newUser = {
      id: userId,
      username,
      email: email || `${username}@example.com`,
      passwordHash,
      firstName: firstName || username,
      lastName: lastName || '',
      role,
      createdAt: new Date(),
      lastLogin: null
    };
    
    users.set(userId, newUser);
    
    const token = generateToken(newUser);
    
    res.status(201).json({ 
      message: 'User created successfully',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = users.get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }
  });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  // For stateless JWT, logout is handled client-side
  // This endpoint exists for consistency and future token blacklisting
  res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/refresh', requireAuth, (req, res) => {
  // Generate new token
  const user = users.get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const token = generateToken(user);
  res.json({ token });
});

// 👥 USER MANAGEMENT ROUTES
// Get all users (authenticated users only)
app.get('/api/users', requireAuth, (req, res) => {
  const userList = Array.from(users.values()).map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status || 'active',
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  }));

  res.json(userList);
});

// Get user by ID (authenticated users only)
app.get('/api/users/:id', requireAuth, (req, res) => {

  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status || 'active',
    createdAt: user.createdAt,
    lastLogin: user.lastLogin
  });
});

// Create new user (authenticated users only)
app.post('/api/users', requireAuth, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role = 'viewer', status = 'active' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user exists
    for (const [id, user] of users) {
      if (user.username === username || user.email === email) {
        return res.status(409).json({ error: 'User already exists' });
      }
    }

    const userId = Date.now().toString();
    const passwordHash = await hashPassword(password);

    const newUser = {
      id: userId,
      username,
      email,
      passwordHash,
      firstName: firstName || username,
      lastName: lastName || '',
      role,
      status,
      createdAt: new Date(),
      lastLogin: null
    };

    users.set(userId, newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (authenticated users only)
app.put('/api/users/:id', requireAuth, async (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { username, email, firstName, lastName, role } = req.body;

  // Check for duplicate username/email
  for (const [id, u] of users) {
    if (id !== req.params.id && (u.username === username || u.email === email)) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
  }

  const updatedUser = {
    ...user,
    username: username || user.username,
    email: email || user.email,
    firstName: firstName || user.firstName,
    lastName: lastName || user.lastName,
    role: role || user.role,
    updatedAt: new Date()
  };

  users.set(req.params.id, updatedUser);

  res.json({
    message: 'User updated successfully',
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
      status: updatedUser.status
    }
  });
});

// Update user status (authenticated users only)
app.patch('/api/users/:id/status', requireAuth, (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { status } = req.body;
  if (!['active', 'inactive', 'pending', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  user.status = status;
  user.updatedAt = new Date();
  users.set(req.params.id, user);

  res.json({
    message: 'User status updated successfully',
    user: {
      id: user.id,
      username: user.username,
      status: user.status
    }
  });
});

// Approve user (authenticated users only)
app.post('/api/users/:id/approve', requireAuth, (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.status = 'active';
  user.approvedAt = new Date();
  user.approvedBy = req.user.id;
  users.set(req.params.id, user);

  res.json({
    message: 'User approved successfully',
    user: {
      id: user.id,
      username: user.username,
      status: user.status
    }
  });
});

// Reject user (authenticated users only)
app.post('/api/users/:id/reject', requireAuth, (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { reason } = req.body;
  user.status = 'rejected';
  user.rejectedAt = new Date();
  user.rejectedBy = req.user.id;
  user.rejectionReason = reason;
  users.set(req.params.id, user);

  res.json({
    message: 'User rejected successfully',
    user: {
      id: user.id,
      username: user.username,
      status: user.status
    }
  });
});

// Delete user (authenticated users only)
app.delete('/api/users/:id', requireAuth, (req, res) => {
  // Prevent deleting yourself
  if (req.user.id === req.params.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  const user = users.get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.delete(req.params.id);

  res.json({ message: 'User deleted successfully' });
});

// 📊 DASHBOARD STATS
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySchedules = Array.from(schedules.values())
    .filter(s => {
      const startTime = new Date(s.startTime);
      return startTime >= today && startTime < tomorrow && s.isActive;
    });

  const activeTasks = Array.from(tasks.values())
    .filter(t => t.status !== 'completed');

  const activeAnnouncements = Array.from(announcements.values())
    .filter(a => a.isActive && (!a.expiresAt || new Date(a.expiresAt) > now));

  res.json({
    totalUsers: users.size,
    totalSchedules: schedules.size,
    todaySchedules: todaySchedules.length,
    totalTasks: tasks.size,
    activeTasks: activeTasks.length,
    completedTasks: tasks.size - activeTasks.length,
    totalAnnouncements: announcements.size,
    activeAnnouncements: activeAnnouncements.length,
    recentSchedules: todaySchedules.slice(0, 5),
    recentTasks: Array.from(tasks.values()).slice(0, 5),
    recentAnnouncements: activeAnnouncements.slice(0, 5)
  });
});

// 📅 SCHEDULE ROUTES
// Public endpoint for display page
app.get('/api/schedule', (req, res) => {
  const { date, room, faculty, search } = req.query;
  
  let scheduleList = Array.from(schedules.values())
    .filter(s => s.isActive);
  
  // Filter by date if provided
  if (date) {
    scheduleList = scheduleList.filter(s => s.date === date);
  }
  
  // Filter by room if provided
  if (room) {
    scheduleList = scheduleList.filter(s => 
      s.room_number?.toLowerCase().includes(room.toLowerCase())
    );
  }
  
  // Filter by faculty if provided
  if (faculty) {
    scheduleList = scheduleList.filter(s => 
      s.faculty_name?.toLowerCase().includes(faculty.toLowerCase())
    );
  }
  
  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    scheduleList = scheduleList.filter(s => 
      s.subject?.toLowerCase().includes(searchLower) ||
      s.faculty_name?.toLowerCase().includes(searchLower) ||
      s.room_number?.toLowerCase().includes(searchLower) ||
      s.title?.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort by start time
  scheduleList.sort((a, b) => {
    const aTime = a.start_time || a.startTime || '';
    const bTime = b.start_time || b.startTime || '';
    return aTime.localeCompare(bTime);
  });
  
  res.json(scheduleList);
});

app.post('/api/schedule', requireAuth, (req, res) => {
  try {
    // Support both formats: academic (room_number, subject, faculty_name) and general (title, content)
    const { 
      title, 
      content, 
      startTime, 
      endTime, 
      start_time,
      end_time,
      date,
      room_number,
      subject,
      faculty_name,
      type = 'schedule', 
      priority = 'medium',
      tags
    } = req.body;
    
    // Validate required fields for academic format
    if (start_time && end_time && room_number && subject && faculty_name) {
      // Academic schedule format
      const scheduleId = Date.now().toString();
      const schedule = {
        id: scheduleId,
        date: date || new Date().toISOString().split('T')[0],
        start_time,
        end_time,
        room_number,
        subject,
        faculty_name,
        tags: tags || [],
        type: type || 'class',
        createdBy: req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        isActive: true
      };
      
      schedules.set(scheduleId, schedule);
      
      // Emit WebSocket update
      io.emit('schedule:update', { date: schedule.date });
      
      return res.status(201).json(schedule);
    }
    
    // General format validation
    if (!title || (!startTime && !start_time) || (!endTime && !end_time)) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: [{ field: 'general', message: 'Required fields missing. Provide either (start_time, end_time, room_number, subject, faculty_name) or (title, startTime, endTime)' }]
      });
    }
    
    // General schedule format
    const scheduleId = Date.now().toString();
    const schedule = {
      id: scheduleId,
      title,
      content: content || '',
      startTime: startTime || start_time,
      endTime: endTime || end_time,
      start_time: start_time || startTime,
      end_time: end_time || endTime,
      date: date || new Date().toISOString().split('T')[0],
      type,
      priority,
      createdBy: req.user.id,
      createdAt: new Date(),
      isActive: true
    };
    
    schedules.set(scheduleId, schedule);
    
    // Emit WebSocket update
    io.emit('schedule:update', { date: schedule.date });
    
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/schedule/:id', requireAuth, (req, res) => {
  const schedule = schedules.get(req.params.id);
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  const { 
    title, 
    content, 
    startTime, 
    endTime, 
    start_time,
    end_time,
    date,
    room_number,
    subject,
    faculty_name,
    type, 
    priority, 
    isActive,
    tags
  } = req.body;
  
  // Update fields if provided
  if (title !== undefined) schedule.title = title;
  if (content !== undefined) schedule.content = content;
  if (startTime !== undefined) {
    schedule.startTime = startTime;
    schedule.start_time = startTime;
  }
  if (endTime !== undefined) {
    schedule.endTime = endTime;
    schedule.end_time = endTime;
  }
  if (start_time !== undefined) {
    schedule.start_time = start_time;
    schedule.startTime = start_time;
  }
  if (end_time !== undefined) {
    schedule.end_time = end_time;
    schedule.endTime = end_time;
  }
  if (date !== undefined) schedule.date = date;
  if (room_number !== undefined) schedule.room_number = room_number;
  if (subject !== undefined) schedule.subject = subject;
  if (faculty_name !== undefined) schedule.faculty_name = faculty_name;
  if (type !== undefined) schedule.type = type;
  if (priority !== undefined) schedule.priority = priority;
  if (isActive !== undefined) schedule.isActive = isActive;
  if (tags !== undefined) schedule.tags = tags;
  
  schedule.updatedAt = new Date();
  schedule.updated_at = new Date().toISOString();
  schedule.updatedBy = req.user.id;
  
  // Emit WebSocket update
  io.emit('schedule:update', { date: schedule.date });
  
  res.json(schedule);
});

app.delete('/api/schedule/:id', requireAuth, (req, res) => {
  const schedule = schedules.get(req.params.id);
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  const scheduleDate = schedule.date;
  schedules.delete(req.params.id);
  
  // Emit WebSocket update
  io.emit('schedule:update', { date: scheduleDate });
  
  res.json({ message: 'Schedule deleted successfully' });
});

// 📢 ANNOUNCEMENT ROUTES
// Public endpoint for display page
app.get('/api/announcements', (req, res) => {
  const announcementList = Array.from(announcements.values())
    .filter(a => a.active || a.isActive)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(announcementList);
});

app.post('/api/announcements', requireAuth, (req, res) => {
  try {
    const { title, content, message, priority = 'medium', expiresAt, active } = req.body;
    
    // Support both formats: {title, content} and {message, active}
    const announcementMessage = message || content;
    const announcementTitle = title || 'Announcement';
    const isActive = active !== undefined ? active : true;
    
    if (!announcementMessage) {
      return res.status(400).json({ error: 'Message or content is required' });
    }
    
    const announcementId = Date.now().toString();
    const announcement = {
      id: announcementId,
      title: announcementTitle,
      content: announcementMessage,
      message: announcementMessage,
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user.id,
      createdAt: new Date(),
      isActive: isActive,
      active: isActive
    };
    
    announcements.set(announcementId, announcement);
    
    // Emit WebSocket update
    io.emit('announcement:update');
    
    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/announcements/:id', requireAuth, (req, res) => {
  const announcement = announcements.get(req.params.id);
  if (!announcement) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  
  const { title, content, message, priority, expiresAt, isActive, active } = req.body;
  
  if (title !== undefined) announcement.title = title;
  if (content !== undefined) {
    announcement.content = content;
    announcement.message = content;
  }
  if (message !== undefined) {
    announcement.message = message;
    announcement.content = message;
  }
  if (priority !== undefined) announcement.priority = priority;
  if (expiresAt !== undefined) announcement.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (isActive !== undefined) {
    announcement.isActive = isActive;
    announcement.active = isActive;
  }
  if (active !== undefined) {
    announcement.active = active;
    announcement.isActive = active;
  }
  
  announcement.updatedAt = new Date();
  announcement.updatedBy = req.user.id;
  
  // Emit WebSocket update
  io.emit('announcement:update');
  
  res.json(announcement);
});

app.delete('/api/announcements/:id', requireAuth, (req, res) => {
  if (!announcements.has(req.params.id)) {
    return res.status(404).json({ error: 'Announcement not found' });
  }
  
  announcements.delete(req.params.id);
  res.json({ message: 'Announcement deleted successfully' });
});

// ✅ TASK ROUTES
app.get('/api/tasks', requireAuth, (req, res) => {
  const taskList = Array.from(tasks.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(taskList);
});

app.post('/api/tasks', requireAuth, (req, res) => {
  try {
    const { title, description, priority = 'medium', status = 'pending', dueDate, assignedTo } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const taskId = Date.now().toString();
    const task = {
      id: taskId,
      title,
      description: description || '',
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedTo: assignedTo || req.user.id,
      createdBy: req.user.id,
      createdAt: new Date()
    };
    
    tasks.set(taskId, task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  const task = tasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  const { title, description, priority, status, dueDate, assignedTo } = req.body;
  
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (status !== undefined) task.status = status;
  if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
  if (assignedTo !== undefined) task.assignedTo = assignedTo;
  
  task.updatedAt = new Date();
  task.updatedBy = req.user.id;
  
  res.json(task);
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  if (!tasks.has(req.params.id)) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks.delete(req.params.id);
  res.json({ message: 'Task deleted successfully' });
});

// 🏢 ENTERPRISE ENDPOINTS (Mock data for demo)
const employees = new Map();
const visitors = new Map();
const rooms = new Map();
const bookings = new Map();
const assets = new Map();

// Employees
app.get('/api/employees', requireAuth, (req, res) => {
  res.json(Array.from(employees.values()));
});

app.post('/api/employees', requireAuth, (req, res) => {
  const { firstName, lastName, email, phone, department, position } = req.body;
  const employeeId = Date.now().toString();
  const employee = {
    id: employeeId,
    firstName,
    lastName,
    email,
    phone,
    department,
    position,
    status: 'active',
    createdAt: new Date(),
    createdBy: req.user.id
  };
  employees.set(employeeId, employee);
  res.status(201).json(employee);
});

app.put('/api/employees/:id', requireAuth, (req, res) => {
  const employee = employees.get(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  
  Object.assign(employee, req.body, { updatedAt: new Date() });
  res.json(employee);
});

app.delete('/api/employees/:id', requireAuth, (req, res) => {
  if (!employees.has(req.params.id)) {
    return res.status(404).json({ error: 'Employee not found' });
  }
  employees.delete(req.params.id);
  res.json({ message: 'Employee deleted successfully' });
});

// Visitors
app.get('/api/visitors', requireAuth, (req, res) => {
  res.json(Array.from(visitors.values()));
});

app.post('/api/visitors', requireAuth, (req, res) => {
  const { name, company, email, phone, purpose, hostEmployee } = req.body;
  const visitorId = Date.now().toString();
  const visitor = {
    id: visitorId,
    name,
    company,
    email,
    phone,
    purpose,
    hostEmployee,
    checkIn: new Date(),
    status: 'checked-in',
    createdBy: req.user.id
  };
  visitors.set(visitorId, visitor);
  res.status(201).json(visitor);
});

// Rooms
app.get('/api/rooms', requireAuth, (req, res) => {
  res.json(Array.from(rooms.values()));
});

app.post('/api/rooms', requireAuth, (req, res) => {
  const { name, capacity, location, amenities } = req.body;
  const roomId = Date.now().toString();
  const room = {
    id: roomId,
    name,
    capacity: parseInt(capacity),
    location,
    amenities,
    status: 'available',
    createdAt: new Date()
  };
  rooms.set(roomId, room);
  res.status(201).json(room);
});

// Bookings
app.get('/api/bookings', requireAuth, (req, res) => {
  res.json(Array.from(bookings.values()));
});

app.post('/api/bookings', requireAuth, (req, res) => {
  const { roomId, title, startTime, endTime, attendees } = req.body;
  const bookingId = Date.now().toString();
  const booking = {
    id: bookingId,
    roomId,
    title,
    startTime,
    endTime,
    attendees,
    status: 'confirmed',
    createdBy: req.user.id,
    createdAt: new Date()
  };
  bookings.set(bookingId, booking);
  res.status(201).json(booking);
});

// Assets
app.get('/api/assets', requireAuth, (req, res) => {
  res.json(Array.from(assets.values()));
});

app.post('/api/assets', requireAuth, (req, res) => {
  const { name, category, serialNumber, location, status } = req.body;
  const assetId = Date.now().toString();
  const asset = {
    id: assetId,
    name,
    category,
    serialNumber,
    location,
    status: status || 'available',
    createdAt: new Date()
  };
  assets.set(assetId, asset);
  res.status(201).json(asset);
});

// Attendance (mock)
app.get('/api/attendance', requireAuth, (req, res) => {
  res.json([]);
});

// Leaves (mock)
app.get('/api/leaves', requireAuth, (req, res) => {
  res.json([]);
});

app.post('/api/leaves', requireAuth, (req, res) => {
  const { employeeId, startDate, endDate, type, reason } = req.body;
  const leaveId = Date.now().toString();
  const leave = {
    id: leaveId,
    employeeId,
    startDate,
    endDate,
    type,
    reason,
    status: 'pending',
    createdAt: new Date()
  };
  res.status(201).json(leave);
});

// Notifications (mock)
app.get('/api/notifications', requireAuth, (req, res) => {
  res.json([]);
});

// Reports (mock)
app.get('/api/reports', requireAuth, (req, res) => {
  res.json([]);
});

// 🎯 DASHBOARD STATS
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaySchedules = Array.from(schedules.values())
    .filter(s => {
      const startTime = new Date(s.startTime);
      return startTime >= today && startTime < tomorrow && s.isActive;
    });
  
  const activeTasks = Array.from(tasks.values())
    .filter(t => t.status !== 'completed');
  
  const activeAnnouncements = Array.from(announcements.values())
    .filter(a => a.isActive && (!a.expiresAt || new Date(a.expiresAt) > now));
  
  res.json({
    totalUsers: users.size,
    todaySchedules: todaySchedules.length,
    activeTasks: activeTasks.length,
    activeAnnouncements: activeAnnouncements.length,
    recentActivity: [
      ...todaySchedules.slice(0, 3).map(s => ({ type: 'schedule', title: s.title, time: s.startTime })),
      ...activeTasks.slice(0, 3).map(t => ({ type: 'task', title: t.title, priority: t.priority })),
      ...activeAnnouncements.slice(0, 3).map(a => ({ type: 'announcement', title: a.title, priority: a.priority }))
    ]
  });
});

// ⚙️ SETTINGS MANAGEMENT ROUTES
const systemSettings = {
  rooms: [
    'Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105',
    'Room 201', 'Room 202', 'Room 203', 'Room 204', 'Room 205',
    'Lab 1', 'Lab 2', 'Lab 3', 'Conference Hall', 'Auditorium',
    'Seminar Hall', 'Board Room', 'Training Room'
  ],
  subjects: [
    'Computer Science Fundamentals', 'Data Structures & Algorithms',
    'Database Management Systems', 'Operating Systems', 'Computer Networks',
    'Software Engineering', 'Web Development', 'Mobile App Development',
    'Artificial Intelligence', 'Machine Learning', 'Cloud Computing',
    'Cybersecurity', 'Digital Marketing', 'Business Analytics',
    'Project Management', 'Team Meeting', 'Workshop', 'Seminar'
  ],
  faculties: [
    'Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Emily Rodriguez',
    'Prof. David Kumar', 'Dr. Lisa Anderson', 'Prof. James Wilson',
    'Dr. Maria Garcia', 'Prof. Robert Taylor', 'Dr. Jennifer Lee',
    'Prof. William Brown', 'Dr. Amanda White', 'Prof. Christopher Davis'
  ],
  departments: [
    'Computer Science', 'Information Technology', 'Electronics',
    'Mechanical', 'Civil', 'Electrical', 'Human Resources',
    'Finance', 'Marketing', 'Operations', 'Administration'
  ],
  positions: [
    'Professor', 'Associate Professor', 'Assistant Professor',
    'Lecturer', 'Senior Lecturer', 'Lab Assistant', 'Manager',
    'Senior Manager', 'Team Lead', 'Developer', 'Senior Developer',
    'Analyst', 'Consultant', 'Administrator', 'Coordinator'
  ],
  locations: [
    'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4',
    'Ground Floor', 'Basement', 'East Wing',
    'West Wing', 'North Block', 'South Block'
  ],
  amenities: [
    'Projector', 'Whiteboard', 'TV Screen', 'Video Conference',
    'Audio System', 'WiFi', 'Air Conditioning', 'Podium',
    'Microphone', 'Smart Board', 'Recording Equipment'
  ],
  companies: [
    'ABC Corporation', 'XYZ Technologies', 'Global Solutions Inc.',
    'Tech Innovators Ltd.', 'Digital Dynamics', 'Future Systems',
    'Smart Solutions', 'Enterprise Partners', 'Innovation Labs',
    'Consulting Group', 'Business Solutions', 'Other'
  ],
  purposes: [
    'Business Meeting', 'Interview', 'Consultation',
    'Training Session', 'Workshop', 'Conference',
    'Product Demo', 'Client Visit', 'Vendor Meeting',
    'Recruitment', 'Audit', 'Other'
  ]
};

// Get all settings
app.get('/api/settings', requireAuth, (req, res) => {
  res.json(systemSettings);
});

// Get settings by category
app.get('/api/settings/:category', requireAuth, (req, res) => {
  const { category } = req.params;
  if (!systemSettings[category]) {
    return res.status(404).json({ error: 'Category not found' });
  }
  res.json({ category, items: systemSettings[category] });
});

// Update settings for a category
app.put('/api/settings/:category', requireAuth, (req, res) => {
  const { category } = req.params;
  const { items } = req.body;
  
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Items must be an array' });
  }
  
  if (!systemSettings.hasOwnProperty(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }
  
  systemSettings[category] = items;
  res.json({ message: 'Settings updated successfully', category, items });
});

// Add item to a category
app.post('/api/settings/:category/items', requireAuth, (req, res) => {
  const { category } = req.params;
  const { item } = req.body;
  
  if (!item || typeof item !== 'string') {
    return res.status(400).json({ error: 'Item must be a string' });
  }
  
  if (!systemSettings[category]) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  if (systemSettings[category].includes(item)) {
    return res.status(400).json({ error: 'Item already exists' });
  }
  
  systemSettings[category].push(item);
  res.status(201).json({ message: 'Item added successfully', category, item, items: systemSettings[category] });
});

// Remove item from a category
app.delete('/api/settings/:category/items/:item', requireAuth, (req, res) => {
  const { category, item } = req.params;
  
  if (!systemSettings[category]) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  const index = systemSettings[category].indexOf(decodeURIComponent(item));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  systemSettings[category].splice(index, 1);
  res.json({ message: 'Item removed successfully', category, items: systemSettings[category] });
});

// 🚫 ERROR HANDLERS
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 🚀 START SERVER
server.listen(PORT, async () => {
  console.log('\n🎉 ===== LIVEBOARD SERVER STARTED SUCCESSFULLY ===== 🎉');
  console.log(`🚀 Server: http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⚡ Features: Authentication, Schedules, Announcements, Tasks, Real-time Socket.io`);

  // Initialize admin user
  try {
    const adminPassword = await hashPassword('afnan711');
    const adminUser = {
      id: 'admin-001',
      username: 'afnan',
      email: 'afnan@liveboard.com',
      passwordHash: adminPassword,
      firstName: 'Afnan',
      lastName: 'Admin',
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      lastLogin: null
    };

    users.set('admin-001', adminUser);
    console.log('✅ Admin user created: afnan/afnan711');
    console.log('📧 Email: afnan@liveboard.com');
    console.log('🔑 Password: afnan711');
    console.log('👤 Role: admin (full access)');

    // Add sample data for impressive demo
    const today = new Date().toISOString().split('T')[0];
    
    const sampleSchedule1 = {
      id: 'schedule-001',
      date: today,
      start_time: '09:00',
      end_time: '10:30',
      room_number: 'Room 101',
      subject: 'Computer Science Fundamentals',
      faculty_name: 'Dr. Sarah Johnson',
      tags: ['CS', 'Theory'],
      type: 'class',
      createdBy: 'admin-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isActive: true
    };
    schedules.set('schedule-001', sampleSchedule1);
    
    const sampleSchedule2 = {
      id: 'schedule-002',
      date: today,
      start_time: '11:00',
      end_time: '12:30',
      room_number: 'Room 102',
      subject: 'Data Structures & Algorithms',
      faculty_name: 'Prof. Michael Chen',
      tags: ['CS', 'Programming'],
      type: 'class',
      createdBy: 'admin-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isActive: true
    };
    schedules.set('schedule-002', sampleSchedule2);
    
    const sampleSchedule3 = {
      id: 'schedule-003',
      date: today,
      start_time: '14:00',
      end_time: '15:30',
      room_number: 'Conference Hall',
      subject: 'Team Meeting - Project Review',
      faculty_name: 'Dr. Emily Rodriguez',
      tags: ['Meeting', 'Project'],
      type: 'meeting',
      createdBy: 'admin-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      isActive: true
    };
    schedules.set('schedule-003', sampleSchedule3);

    const sampleAnnouncement = {
      id: 'announcement-001',
      title: 'Welcome to LiveBoard!',
      content: 'Your digital display management system is ready to use. Manage schedules, announcements, and tasks efficiently.',
      message: 'Your digital display management system is ready to use. Manage schedules, announcements, and tasks efficiently.',
      priority: 'high',
      expiresAt: null,
      createdBy: 'admin-001',
      createdAt: new Date(),
      isActive: true,
      active: true
    };
    announcements.set('announcement-001', sampleAnnouncement);

    const sampleTask = {
      id: 'task-001',
      title: 'Setup LiveBoard System',
      description: 'Complete the initial setup and configuration of the LiveBoard system',
      priority: 'high',
      status: 'completed',
      dueDate: new Date(),
      assignedTo: 'admin-001',
      createdBy: 'admin-001',
      createdAt: new Date()
    };
    tasks.set('task-001', sampleTask);

    console.log('✅ Sample data loaded for demo');
    console.log('🎯 Ready for submission!');

  } catch (error) {
    console.error('⚠️ Admin setup failed:', error.message);
  }

  // 🔌 SOCKET.IO REAL-TIME FUNCTIONALITY
  io.on('connection', (socket) => {
    console.log('🔗 Client connected:', socket.id);

    // Authentication middleware for socket
    socket.on('authenticate', (token) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.emit('authenticated', { success: true });
        console.log(`🔐 Socket authenticated for user: ${decoded.username}`);
      } catch (error) {
        socket.emit('authentication_error', { error: 'Invalid token' });
      }
    });

    // Real-time schedule updates
    socket.on('schedule_created', (schedule) => {
      if (socket.userId) {
        schedules.set(schedule.id, schedule);
        socket.broadcast.emit('schedule_update', { action: 'created', schedule });
      }
    });

    socket.on('schedule_updated', (schedule) => {
      if (socket.userId) {
        schedules.set(schedule.id, schedule);
        socket.broadcast.emit('schedule_update', { action: 'updated', schedule });
      }
    });

    socket.on('schedule_deleted', (scheduleId) => {
      if (socket.userId) {
        schedules.delete(scheduleId);
        socket.broadcast.emit('schedule_update', { action: 'deleted', scheduleId });
      }
    });

    // Real-time announcement updates
    socket.on('announcement_created', (announcement) => {
      if (socket.userId) {
        announcements.set(announcement.id, announcement);
        socket.broadcast.emit('announcement_update', { action: 'created', announcement });
      }
    });

    socket.on('announcement_updated', (announcement) => {
      if (socket.userId) {
        announcements.set(announcement.id, announcement);
        socket.broadcast.emit('announcement_update', { action: 'updated', announcement });
      }
    });

    socket.on('announcement_deleted', (announcementId) => {
      if (socket.userId) {
        announcements.delete(announcementId);
        socket.broadcast.emit('announcement_update', { action: 'deleted', announcementId });
      }
    });

    // Real-time task updates
    socket.on('task_created', (task) => {
      if (socket.userId) {
        tasks.set(task.id, task);
        socket.broadcast.emit('task_update', { action: 'created', task });
      }
    });

    socket.on('task_updated', (task) => {
      if (socket.userId) {
        tasks.set(task.id, task);
        socket.broadcast.emit('task_update', { action: 'updated', task });
      }
    });

    socket.on('task_deleted', (taskId) => {
      if (socket.userId) {
        tasks.delete(taskId);
        socket.broadcast.emit('task_update', { action: 'deleted', taskId });
      }
    });

    // Request current data
    socket.on('request_data', (dataType) => {
      if (!socket.userId) return;

      switch (dataType) {
        case 'schedules':
          socket.emit('schedules_data', Array.from(schedules.values()));
          break;
        case 'announcements':
          socket.emit('announcements_data', Array.from(announcements.values()).filter(a => a.isActive));
          break;
        case 'tasks':
          socket.emit('tasks_data', Array.from(tasks.values()));
          break;
        case 'dashboard':
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const todaySchedules = Array.from(schedules.values())
            .filter(s => {
              const startTime = new Date(s.startTime);
              return startTime >= today && startTime < tomorrow && s.isActive;
            });

          const activeTasks = Array.from(tasks.values())
            .filter(t => t.status !== 'completed');

          const activeAnnouncements = Array.from(announcements.values())
            .filter(a => a.isActive && (!a.expiresAt || new Date(a.expiresAt) > now));

          socket.emit('dashboard_data', {
            totalUsers: users.size,
            todaySchedules: todaySchedules.length,
            activeTasks: activeTasks.length,
            activeAnnouncements: activeAnnouncements.length,
            recentActivity: [
              ...todaySchedules.slice(0, 3).map(s => ({ type: 'schedule', title: s.title, time: s.startTime })),
              ...activeTasks.slice(0, 3).map(t => ({ type: 'task', title: t.title, priority: t.priority })),
              ...activeAnnouncements.slice(0, 3).map(a => ({ type: 'announcement', title: a.title, priority: a.priority }))
            ]
          });
          break;
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });
});

// 🛑 GRACEFUL SHUTDOWN
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;
