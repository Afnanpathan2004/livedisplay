// Simple, working server without complex dependencies
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 4000;
const app = express();

// Simple CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Simple auth routes
const authController = require('./controllers/authController');

app.post('/api/auth/login', async (req, res) => {
  try {
    // Handle both emailOrUsername and username
    const { emailOrUsername, username, password } = req.body;
    const loginIdentifier = emailOrUsername || username;
    
    if (!loginIdentifier || !password) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: [{ field: 'emailOrUsername', message: 'Required' }]
      });
    }
    
    // Use the existing auth controller logic
    req.body = { emailOrUsername: loginIdentifier, username: loginIdentifier, password };
    await authController.login(req, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    await authController.me(req, res);
  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Load other routes with error handling
try {
  const scheduleRoutes = require('./routes/scheduleRoutes');
  const announcementRoutes = require('./routes/announcementRoutes');
  const taskRoutes = require('./routes/taskRoutes');
  
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/tasks', taskRoutes);
  
  console.log('✓ Core routes loaded successfully');
} catch (error) {
  console.warn('⚠ Some routes failed to load:', error.message);
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LiveBoard server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Bootstrap admin user
(async () => {
  try {
    const { getUserByUsername, createUser } = require('./utils/auth');
    const existing = await getUserByUsername('admin');
    if (!existing) {
      const admin = await createUser({ 
        username: 'admin', 
        email: 'admin@example.com', 
        password: 'admin123', 
        role: 'admin' 
      });
      console.log('✓ Created default admin user:', admin.username);
    } else {
      console.log('✓ Admin user already exists');
    }
  } catch (e) {
    console.warn('⚠ Admin bootstrap failed:', e.message);
  }
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
