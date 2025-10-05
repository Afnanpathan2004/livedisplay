const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const { logger } = require('../utils/logger');
const { auditLog } = require('../utils/audit');

class User {
  constructor(data = {}) {
    this.id = data.id;
    this.employeeId = data.employee_id;
    this.username = data.username;
    this.email = data.email;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.phone = data.phone;
    this.role = data.role;
    this.status = data.status;
    this.departmentId = data.department_id;
    this.designation = data.designation;
    this.reportingManagerId = data.reporting_manager_id;
    this.buildingId = data.building_id;
    this.floorId = data.floor_id;
    this.workstation = data.workstation;
    this.joiningDate = data.joining_date;
    this.leavingDate = data.leaving_date;
    this.profilePictureUrl = data.profile_picture_url;
    this.emergencyContact = data.emergency_contact;
    this.permissions = data.permissions || [];
    this.lastLogin = data.last_login;
    this.passwordChangedAt = data.password_changed_at;
    this.failedLoginAttempts = data.failed_login_attempts || 0;
    this.lockedUntil = data.locked_until;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new user
  static async create(userData, createdBy = null) {
    const {
      employeeId,
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      role = 'employee',
      status = 'active',
      departmentId,
      designation,
      reportingManagerId,
      buildingId,
      floorId,
      workstation,
      joiningDate,
      profilePictureUrl,
      emergencyContact,
      permissions = []
    } = userData;

    // Validate required fields
    if (!employeeId || !username || !email || !password || !firstName || !lastName) {
      throw new Error('Missing required fields');
    }

    // Check for existing user
    const existing = await User.findByEmailOrUsername(email, username);
    if (existing) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const sql = `
      INSERT INTO users (
        employee_id, username, email, password_hash, first_name, last_name,
        phone, role, status, department_id, designation, reporting_manager_id,
        building_id, floor_id, workstation, joining_date, profile_picture_url,
        emergency_contact, permissions
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `;

    const values = [
      employeeId, username, email, passwordHash, firstName, lastName,
      phone, role, status, departmentId, designation, reportingManagerId,
      buildingId, floorId, workstation, joiningDate, profilePictureUrl,
      JSON.stringify(emergencyContact), JSON.stringify(permissions)
    ];

    try {
      const result = await query(sql, values);
      const user = new User(result.rows[0]);

      // Audit log
      if (createdBy) {
        await auditLog(createdBy, 'CREATE', 'user', user.id, null, user.toJSON());
      }

      logger.info('User created successfully', {
        userId: user.id,
        employeeId: user.employeeId,
        email: user.email,
        createdBy
      });

      return user;
    } catch (error) {
      logger.error('Error creating user', {
        error: error.message,
        employeeId,
        email
      });
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    const sql = 'SELECT * FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Find user by username
  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = $1';
    const result = await query(sql, [username]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Find user by email or username
  static async findByEmailOrUsername(email, username) {
    const sql = 'SELECT * FROM users WHERE email = $1 OR username = $2';
    const result = await query(sql, [email, username]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Find user by employee ID
  static async findByEmployeeId(employeeId) {
    const sql = 'SELECT * FROM users WHERE employee_id = $1';
    const result = await query(sql, [employeeId]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Get all users with filters
  static async findAll(filters = {}) {
    let sql = `
      SELECT u.*, d.name as department_name, 
             rm.first_name as manager_first_name, rm.last_name as manager_last_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users rm ON u.reporting_manager_id = rm.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 0;

    // Apply filters
    if (filters.status) {
      sql += ` AND u.status = $${++paramCount}`;
      values.push(filters.status);
    }

    if (filters.role) {
      sql += ` AND u.role = $${++paramCount}`;
      values.push(filters.role);
    }

    if (filters.departmentId) {
      sql += ` AND u.department_id = $${++paramCount}`;
      values.push(filters.departmentId);
    }

    if (filters.search) {
      sql += ` AND (u.first_name ILIKE $${++paramCount} OR u.last_name ILIKE $${++paramCount} OR u.email ILIKE $${++paramCount} OR u.employee_id ILIKE $${++paramCount})`;
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Pagination
    const limit = filters.limit || 50;
    const offset = (filters.page - 1) * limit || 0;
    sql += ` ORDER BY u.first_name, u.last_name LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    return result.rows.map(row => new User(row));
  }

  // Update user
  async update(updateData, updatedBy = null) {
    const allowedFields = [
      'first_name', 'last_name', 'phone', 'designation', 'reporting_manager_id',
      'building_id', 'floor_id', 'workstation', 'profile_picture_url',
      'emergency_contact', 'permissions', 'status'
    ];

    const updates = [];
    const values = [];
    let paramCount = 0;

    const oldValues = this.toJSON();

    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates.push(`${key} = $${++paramCount}`);
        
        // Handle JSON fields
        if (['emergency_contact', 'permissions'].includes(key)) {
          values.push(JSON.stringify(updateData[key]));
        } else {
          values.push(updateData[key]);
        }
        
        // Update instance property
        const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
        this[camelKey] = updateData[key];
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(this.id);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${++paramCount} RETURNING *`;

    try {
      const result = await query(sql, values);
      const updatedUser = new User(result.rows[0]);

      // Audit log
      if (updatedBy) {
        await auditLog(updatedBy, 'UPDATE', 'user', this.id, oldValues, updatedUser.toJSON());
      }

      logger.info('User updated successfully', {
        userId: this.id,
        updatedFields: Object.keys(updateData),
        updatedBy
      });

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user', {
        error: error.message,
        userId: this.id,
        updateData
      });
      throw error;
    }
  }

  // Update password
  async updatePassword(newPassword, updatedBy = null) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    const sql = `
      UPDATE users 
      SET password_hash = $1, password_changed_at = CURRENT_TIMESTAMP, 
          failed_login_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING *
    `;

    try {
      const result = await query(sql, [passwordHash, this.id]);
      
      // Audit log
      if (updatedBy) {
        await auditLog(updatedBy, 'PASSWORD_CHANGE', 'user', this.id);
      }

      logger.info('User password updated', {
        userId: this.id,
        updatedBy
      });

      return new User(result.rows[0]);
    } catch (error) {
      logger.error('Error updating password', {
        error: error.message,
        userId: this.id
      });
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }

  // Update last login
  async updateLastLogin() {
    const sql = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, failed_login_attempts = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING last_login
    `;
    
    const result = await query(sql, [this.id]);
    this.lastLogin = result.rows[0].last_login;
    return this.lastLogin;
  }

  // Handle failed login attempt
  async handleFailedLogin() {
    const maxAttempts = 5;
    const lockDuration = 30; // minutes

    const sql = `
      UPDATE users 
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE 
            WHEN failed_login_attempts + 1 >= $1 
            THEN CURRENT_TIMESTAMP + INTERVAL '${lockDuration} minutes'
            ELSE locked_until
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING failed_login_attempts, locked_until
    `;

    const result = await query(sql, [maxAttempts, this.id]);
    this.failedLoginAttempts = result.rows[0].failed_login_attempts;
    this.lockedUntil = result.rows[0].locked_until;

    logger.warn('Failed login attempt', {
      userId: this.id,
      attempts: this.failedLoginAttempts,
      locked: !!this.lockedUntil
    });
  }

  // Check if account is locked
  isLocked() {
    return this.lockedUntil && new Date(this.lockedUntil) > new Date();
  }

  // Soft delete user
  async softDelete(deletedBy = null) {
    const oldValues = this.toJSON();
    
    const sql = `
      UPDATE users 
      SET status = 'inactive', leaving_date = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING *
    `;

    try {
      const result = await query(sql, [this.id]);
      const updatedUser = new User(result.rows[0]);

      // Audit log
      if (deletedBy) {
        await auditLog(deletedBy, 'SOFT_DELETE', 'user', this.id, oldValues, updatedUser.toJSON());
      }

      logger.info('User soft deleted', {
        userId: this.id,
        deletedBy
      });

      return updatedUser;
    } catch (error) {
      logger.error('Error soft deleting user', {
        error: error.message,
        userId: this.id
      });
      throw error;
    }
  }

  // Get user statistics
  static async getStatistics() {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE role = 'hr') as hr,
        COUNT(*) FILTER (WHERE role = 'manager') as managers,
        COUNT(*) FILTER (WHERE role = 'employee') as employees,
        COUNT(*) FILTER (WHERE last_login > CURRENT_DATE - INTERVAL '30 days') as active_last_30_days
      FROM users
    `;

    const result = await query(sql);
    return result.rows[0];
  }

  // Convert to JSON (excluding sensitive data)
  toJSON() {
    return {
      id: this.id,
      employeeId: this.employeeId,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      role: this.role,
      status: this.status,
      departmentId: this.departmentId,
      designation: this.designation,
      reportingManagerId: this.reportingManagerId,
      buildingId: this.buildingId,
      floorId: this.floorId,
      workstation: this.workstation,
      joiningDate: this.joiningDate,
      leavingDate: this.leavingDate,
      profilePictureUrl: this.profilePictureUrl,
      emergencyContact: this.emergencyContact,
      permissions: this.permissions,
      lastLogin: this.lastLogin,
      passwordChangedAt: this.passwordChangedAt,
      failedLoginAttempts: this.failedLoginAttempts,
      lockedUntil: this.lockedUntil,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Get full name
  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // Check if user has permission
  hasPermission(permission) {
    return this.permissions.includes(permission) || this.role === 'admin';
  }
}

module.exports = User;
