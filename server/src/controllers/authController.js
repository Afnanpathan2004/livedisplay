const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { 
  generateToken, 
  generateRefreshToken,
  verifyPassword,
  createUser,
  getUserByUsername,
  updateLastLogin
} = require('../utils/auth');
const mockDb = require('../utils/mockDb');
const { createAuditLog } = require('../utils/audit');
const { PrismaClient } = require('@prisma/client');

// Use mock database to avoid Prisma connection issues
const prisma = require('../utils/mockDb');

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1)
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  password: z.string().min(6),
  role: z.enum(['admin', 'editor', 'viewer']).optional()
});

exports.login = async (req, res, next) => {
  try {
    // Handle both emailOrUsername (from validation middleware) and username (legacy)
    const { emailOrUsername, username, password } = req.body;
    const loginIdentifier = emailOrUsername || username;
    
    const user = await getUserByUsername(loginIdentifier);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await updateLastLogin(user.id);

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await mockDb.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await getUserByUsername(data.username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const user = await createUser(data);

    res.status(201).json({ 
      message: 'User created successfully',
      user 
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key');
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const user = await getUserByUsername(decoded.username);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const newAccessToken = generateToken(user);

    res.json({ token: newAccessToken });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};