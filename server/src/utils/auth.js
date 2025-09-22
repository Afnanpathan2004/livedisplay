const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Use mock database to avoid Prisma connection issues
const mockDb = require('./mockDb');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User roles and permissions
const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor', 
  VIEWER: 'viewer'
};

const PERMISSIONS = {
  READ_SCHEDULE: 'read:schedule',
  WRITE_SCHEDULE: 'write:schedule',
  DELETE_SCHEDULE: 'delete:schedule',
  READ_ANNOUNCEMENTS: 'read:announcements',
  WRITE_ANNOUNCEMENTS: 'write:announcements',
  READ_TASKS: 'read:tasks',
  WRITE_TASKS: 'write:tasks',
  MANAGE_USERS: 'manage:users',
  EXPORT_DATA: 'export:data',
  IMPORT_DATA: 'import:data'
};

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.EDITOR]: [
    PERMISSIONS.READ_SCHEDULE,
    PERMISSIONS.WRITE_SCHEDULE,
    PERMISSIONS.DELETE_SCHEDULE,
    PERMISSIONS.READ_ANNOUNCEMENTS,
    PERMISSIONS.WRITE_ANNOUNCEMENTS,
    PERMISSIONS.READ_TASKS,
    PERMISSIONS.WRITE_TASKS,
    PERMISSIONS.EXPORT_DATA
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.READ_SCHEDULE,
    PERMISSIONS.READ_ANNOUNCEMENTS,
    PERMISSIONS.READ_TASKS
  ]
};

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Helper functions for permissions
function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role || ROLES.VIEWER,
      permissions: ROLE_PERMISSIONS[user.role || ROLES.VIEWER],
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      type: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}

async function createUser({ username, email, password, role = 'viewer' }) {
  const passwordHash = await hashPassword(password);
  
  return mockDb.createUser({
    username,
    email,
    passwordHash,
    role
  });
}

async function getUserByUsername(username) {
  return mockDb.getUserByUsername(username);
}

async function updateLastLogin(userId) {
  return mockDb.updateUserLastLogin(userId);
}

// Alias for compatibility
const findUserByUsername = getUserByUsername;
const findUserById = (id) => mockDb.getUserById(id);
const comparePassword = verifyPassword;

// Legacy function for backward compatibility
function requireAuth(req, res, next) {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASSWORD;

  // If auth is not configured, treat as open (optional auth)
  if (!adminUser || !adminPass) return next();

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_me');
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { 
  generateToken, 
  generateRefreshToken,
  hashPassword,
  verifyPassword,
  comparePassword,
  authenticateToken, 
  createUser,
  getUserByUsername,
  findUserByUsername,
  findUserById,
  updateLastLogin,
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  requirePermission
};