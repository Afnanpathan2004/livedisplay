const jwt = require('jsonwebtoken');

// Simple logger fallback
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

// Simple role permissions
const ROLE_PERMISSIONS = {
  admin: ['*'],
  editor: ['read', 'write'],
  viewer: ['read']
};

// Middleware to require authentication
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token', {
        error: jwtError.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Auth middleware error', {
      error: error.message,
      stack: error.stack,
      ip: req.ip
    });
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to require specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (!userPermissions.includes(permission)) {
      logger.warn('Permission denied', {
        userId: req.user.id,
        userRole,
        requiredPermission: permission,
        ip: req.ip
      });
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: permission 
      });
    }
    
    next();
  };
};

// Middleware to require specific role
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== role) {
      logger.warn('Role access denied', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRole: role,
        ip: req.ip
      });
      return res.status(403).json({ 
        error: 'Insufficient role permissions',
        required: role 
      });
    }
    
    next();
  };
};

// Middleware to require admin role
const requireAdmin = requireRole('admin');

// Middleware for display access
const displayAuth = (req, res, next) => {
  // 1) If a valid Bearer token is provided, allow
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (_) {
      // fall through to origin check
    }
  }

  // 2) Otherwise, allow based on server-side allowlist of origins
  const origin = req.get('Origin') || req.get('origin') || '';
  const allowed = (process.env.DISPLAY_ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (origin && allowed.includes(origin)) {
    return next();
  }

  return res.status(401).json({ error: 'Display access denied' });
};

module.exports = {
  requireAuth,
  requirePermission,
  requireRole,
  requireAdmin,
  displayAuth
};
