const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');

// Simple logger fallback to avoid dependency issues
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

const auditLogger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

// Initialize environment variables first
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 4000;
const app = express();

// CORS configuration - allow local dev and deployed frontends
const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:51819'
];

// Support env-based origins (comma separated)
const envOrigins = [];
if (process.env.CLIENT_ORIGIN) envOrigins.push(process.env.CLIENT_ORIGIN);
if (process.env.CORS_ALLOWED_ORIGINS) {
  envOrigins.push(
    ...process.env.CORS_ALLOWED_ORIGINS
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
  );
}
if (process.env.ALLOWED_ORIGINS) {
  envOrigins.push(
    ...process.env.ALLOWED_ORIGINS
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
  );
}

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser or same-origin requests (no origin header)
    if (!origin) return callback(null, true);
    
    // Netlify preview and app domains helper
    const netlifyPattern = /https?:\/\/([a-z0-9-]+)\.netlify\.app$/i;
    const renderPattern = /https?:\/\/([a-z0-9-]+)\.onrender\.com$/i;
    
    if (
      allowedOrigins.includes(origin) ||
      netlifyPattern.test(origin) ||
      renderPattern.test(origin)
    ) {
      return callback(null, true);
    }
    
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLogger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
  }
});
app.use('/api/', limiter);

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight for all routes
app.options('*', cors(corsOptions));

// HTTP request logging
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
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

// Load routes with error handling
try {
  const authRoutes = require('./routes/authRoutes');
  const scheduleRoutes = require('./routes/scheduleRoutes');
  const announcementRoutes = require('./routes/announcementRoutes');
  const taskRoutes = require('./routes/taskRoutes');
  const exportRoutes = require('./routes/exportRoutes');

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/export', exportRoutes);

  // TODO: Enterprise routes temporarily disabled - need schema fixes
  // const employeeRoutes = require('./routes/employeeRoutes');
  // const roomBookingRoutes = require('./routes/roomBookingRoutes');
  // const visitorRoutes = require('./routes/visitorRoutes');
  // const assetRoutes = require('./routes/assetRoutes');
  // const attendanceRoutes = require('./routes/attendanceRoutes');
  // const leaveRoutes = require('./routes/leaveRoutes');
  // const notificationRoutes = require('./routes/notificationRoutes');

  logger.info('✓ Basic routes loaded successfully');
  console.log('✓ Basic routes loaded successfully');
} catch (error) {
  logger.error('✗ Error loading routes:', { error: error.message, stack: error.stack });
  console.error('✗ Error loading routes:', error.message);
  process.exit(1);
}

// Error handler
app.use((err, req, res, next) => {
  const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  logger.error('Server Error', {
    errorId,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({ 
    error: isDevelopment ? err.message : 'Internal Server Error',
    errorId: isDevelopment ? errorId : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Create server
const server = http.createServer(app);

// Initialize WebSocket with error handling
try {
  const { initIO } = require('./websocket');
  const io = initIO(server, corsOptions.origin);
  console.log('✓ WebSocket initialized');
  
  // Start cron jobs
  try {
    const { startMidnightCron } = require('./cron/midnightReset');
    startMidnightCron(io);
    console.log('✓ Cron jobs started');
  } catch (cronError) {
    console.warn('⚠ Cron jobs failed to start:', cronError.message);
  }
} catch (wsError) {
  console.warn('⚠ WebSocket failed to initialize:', wsError.message);
}

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 LiveBoard server running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 LiveBoard server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Bootstrap admin user
(async () => {
  try {
    const { getUserByUsername, createUser } = require('./utils/auth');
    const existing = await getUserByUsername('admin');
    if (!existing) {
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const admin = await createUser({ 
        username: 'admin', 
        email: 'admin@example.com', 
        password: adminPassword, 
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
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});
