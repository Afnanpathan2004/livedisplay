const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');
const { logger } = require('./logger');
const User = require('../models/User');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    
    // Validate secrets in production
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        throw new Error('JWT secrets must be set in production environment');
      }
    }
  }

  // Generate access token
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      type: 'access'
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'livedisplay-api',
      audience: 'livedisplay-client'
    });
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh',
      tokenId: crypto.randomUUID()
    };

    return jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'livedisplay-api',
      audience: 'livedisplay-client'
    });
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret, {
        issuer: 'livedisplay-api',
        audience: 'livedisplay-client'
      });
    } catch (error) {
      logger.warn('Access token verification failed', {
        error: error.message,
        token: token.substring(0, 20) + '...'
      });
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret, {
        issuer: 'livedisplay-api',
        audience: 'livedisplay-client'
      });
    } catch (error) {
      logger.warn('Refresh token verification failed', {
        error: error.message,
        token: token.substring(0, 20) + '...'
      });
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Store refresh token in database
  async storeRefreshToken(userId, token, expiresAt, deviceInfo = {}) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const sql = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at, device_info, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, device_fingerprint) 
      DO UPDATE SET 
        token_hash = EXCLUDED.token_hash,
        expires_at = EXCLUDED.expires_at,
        created_at = EXCLUDED.created_at
      RETURNING id
    `;

    const deviceFingerprint = this.generateDeviceFingerprint(deviceInfo);
    
    try {
      await query(sql, [userId, tokenHash, expiresAt, JSON.stringify(deviceInfo)]);
      logger.info('Refresh token stored', { userId, deviceFingerprint });
    } catch (error) {
      logger.error('Error storing refresh token', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  // Validate refresh token from database
  async validateRefreshToken(token, userId) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const sql = `
      SELECT id, expires_at, is_revoked 
      FROM refresh_tokens 
      WHERE user_id = $1 AND token_hash = $2 AND expires_at > CURRENT_TIMESTAMP
    `;

    try {
      const result = await query(sql, [userId, tokenHash]);
      
      if (result.rows.length === 0) {
        logger.warn('Refresh token not found or expired', { userId });
        return false;
      }

      const tokenRecord = result.rows[0];
      
      if (tokenRecord.is_revoked) {
        logger.warn('Refresh token has been revoked', { userId, tokenId: tokenRecord.id });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating refresh token', {
        error: error.message,
        userId
      });
      return false;
    }
  }

  // Revoke refresh token
  async revokeRefreshToken(token, userId) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const sql = `
      UPDATE refresh_tokens 
      SET is_revoked = true, revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND token_hash = $2
    `;

    try {
      await query(sql, [userId, tokenHash]);
      logger.info('Refresh token revoked', { userId });
    } catch (error) {
      logger.error('Error revoking refresh token', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  // Revoke all refresh tokens for user
  async revokeAllRefreshTokens(userId) {
    const sql = `
      UPDATE refresh_tokens 
      SET is_revoked = true, revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND is_revoked = false
    `;

    try {
      const result = await query(sql, [userId]);
      logger.info('All refresh tokens revoked', { 
        userId, 
        revokedCount: result.rowCount 
      });
      return result.rowCount;
    } catch (error) {
      logger.error('Error revoking all refresh tokens', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  // Clean expired tokens
  async cleanExpiredTokens() {
    const sql = `
      DELETE FROM refresh_tokens 
      WHERE expires_at < CURRENT_TIMESTAMP OR 
            (is_revoked = true AND revoked_at < CURRENT_TIMESTAMP - INTERVAL '30 days')
    `;

    try {
      const result = await query(sql);
      logger.info('Expired tokens cleaned', { deletedCount: result.rowCount });
      return result.rowCount;
    } catch (error) {
      logger.error('Error cleaning expired tokens', {
        error: error.message
      });
      throw error;
    }
  }

  // Generate device fingerprint
  generateDeviceFingerprint(deviceInfo) {
    const { userAgent, ip, acceptLanguage } = deviceInfo;
    const fingerprint = crypto
      .createHash('sha256')
      .update(`${userAgent || ''}${ip || ''}${acceptLanguage || ''}`)
      .digest('hex');
    return fingerprint;
  }

  // Login with enhanced security
  async login(emailOrUsername, password, deviceInfo = {}) {
    try {
      // Find user
      const user = await User.findByEmailOrUsername(emailOrUsername, emailOrUsername);
      
      if (!user) {
        logger.warn('Login attempt with non-existent user', { 
          emailOrUsername: emailOrUsername.substring(0, 5) + '***' 
        });
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (user.isLocked()) {
        logger.warn('Login attempt on locked account', { userId: user.id });
        throw new Error('Account is temporarily locked due to multiple failed login attempts');
      }

      // Check if account is active
      if (user.status !== 'active') {
        logger.warn('Login attempt on inactive account', { userId: user.id });
        throw new Error('Account is not active');
      }

      // Verify password
      const isValidPassword = await user.verifyPassword(password);
      
      if (!isValidPassword) {
        await user.handleFailedLogin();
        logger.warn('Invalid password attempt', { userId: user.id });
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Store refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await this.storeRefreshToken(user.id, refreshToken, expiresAt, deviceInfo);

      // Update last login
      await user.updateLastLogin();

      logger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceFingerprint: this.generateDeviceFingerprint(deviceInfo)
      });

      return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn: this.accessTokenExpiry
      };

    } catch (error) {
      logger.error('Login failed', {
        error: error.message,
        emailOrUsername: emailOrUsername.substring(0, 5) + '***'
      });
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken, deviceInfo = {}) {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Validate token in database
      const isValid = await this.validateRefreshToken(refreshToken, decoded.id);
      
      if (!isValid) {
        throw new Error('Refresh token is invalid or expired');
      }

      // Get user
      const user = await User.findById(decoded.id);
      
      if (!user || user.status !== 'active') {
        throw new Error('User not found or inactive');
      }

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);

      logger.info('Access token refreshed', {
        userId: user.id,
        deviceFingerprint: this.generateDeviceFingerprint(deviceInfo)
      });

      return {
        accessToken: newAccessToken,
        expiresIn: this.accessTokenExpiry
      };

    } catch (error) {
      logger.error('Token refresh failed', {
        error: error.message
      });
      throw error;
    }
  }

  // Logout
  async logout(refreshToken, userId) {
    try {
      if (refreshToken) {
        await this.revokeRefreshToken(refreshToken, userId);
      }

      logger.info('User logged out', { userId });
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Logout failed', {
        error: error.message,
        userId
      });
      throw error;
    }
  }

  // Password strength validation
  validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const issues = [];

    if (password.length < minLength) {
      issues.push(`Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase) {
      issues.push('Password must contain at least one uppercase letter');
    }

    if (!hasLowerCase) {
      issues.push('Password must contain at least one lowercase letter');
    }

    if (!hasNumbers) {
      issues.push('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
      issues.push('Password must contain at least one special character');
    }

    return {
      isValid: issues.length === 0,
      issues,
      strength: this.calculatePasswordStrength(password)
    };
  }

  // Calculate password strength score
  calculatePasswordStrength(password) {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (password.length >= 16) score += 1;

    if (score < 3) return 'weak';
    if (score < 5) return 'medium';
    return 'strong';
  }
}

module.exports = new AuthService();
