const { z } = require('zod');
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

// Simple logger fallback
const logger = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};

// Enhanced validation schemas with production-grade security
const commonSchemas = {
  id: z.string().uuid('Invalid UUID format'),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .refine(email => validator.isEmail(email), 'Invalid email format'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .refine(password => {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      return hasUpper && hasLower && hasNumber && hasSpecial;
    }, 'Password must contain uppercase, lowercase, number and special character'),
  
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, hyphens and underscores'),
  
  employeeId: z.string()
    .min(3, 'Employee ID must be at least 3 characters')
    .max(20, 'Employee ID too long')
    .regex(/^[A-Z0-9]+$/, 'Employee ID can only contain uppercase letters and numbers'),
  
  role: z.enum(['admin', 'hr', 'manager', 'employee', 'security', 'maintenance'], { 
    errorMap: () => ({ message: 'Invalid role' }) 
  }),
  
  userStatus: z.enum(['active', 'inactive', 'suspended', 'pending'], {
    errorMap: () => ({ message: 'Invalid user status' })
  }),
  
  date: z.string().refine((val) => validator.isISO8601(val), 'Invalid date format (ISO 8601 required)'),
  
  dateTime: z.string().refine((val) => validator.isISO8601(val), 'Invalid datetime format (ISO 8601 required)'),
  
  priority: z.enum(['low', 'medium', 'high', 'urgent'], { 
    errorMap: () => ({ message: 'Invalid priority' }) 
  }),
  
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'completed'], { 
    errorMap: () => ({ message: 'Invalid status' }) 
  }),
  
  phone: z.string()
    .optional()
    .refine(phone => !phone || validator.isMobilePhone(phone, 'any'), 'Invalid phone number format'),
  
  url: z.string()
    .optional()
    .refine(url => !url || validator.isURL(url), 'Invalid URL format'),
  
  ipAddress: z.string()
    .optional()
    .refine(ip => !ip || validator.isIP(ip), 'Invalid IP address'),
  
  text: (min = 0, max = 1000) => z.string()
    .min(min, `Text must be at least ${min} characters`)
    .max(max, `Text must not exceed ${max} characters`)
    .refine(text => !/<script|javascript:|data:|vbscript:/i.test(text), 'Potentially dangerous content detected'),
  
  safeHtml: (max = 5000) => z.string()
    .max(max, `Content too long (max ${max} characters)`)
    .transform(html => DOMPurify.sanitize(html)),
  
  jsonObject: z.record(z.any()).optional(),
  
  arrayOfStrings: z.array(z.string()).optional(),
  
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  
  nonNegativeInteger: z.number().int().min(0, 'Must be non-negative'),
  
  decimal: (precision = 2) => z.number()
    .refine(num => Number.isFinite(num), 'Must be a valid number')
    .transform(num => Number(num.toFixed(precision)))
};

// Enhanced Auth validation schemas
const authSchemas = {
  login: z.object({
    emailOrUsername: z.string()
      .min(1, 'Email or username is required')
      .max(255, 'Input too long'),
    password: z.string().min(1, 'Password is required').max(128, 'Password too long'),
    rememberMe: z.boolean().optional().default(false),
    deviceInfo: z.object({
      userAgent: z.string().optional(),
      ip: commonSchemas.ipAddress,
      acceptLanguage: z.string().optional()
    }).optional()
  }),
  
  register: z.object({
    employeeId: commonSchemas.employeeId,
    username: commonSchemas.username,
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: commonSchemas.text(1, 100),
    lastName: commonSchemas.text(1, 100),
    phone: commonSchemas.phone,
    role: commonSchemas.role.optional().default('employee'),
    departmentId: commonSchemas.id.optional(),
    designation: commonSchemas.text(0, 255).optional(),
    reportingManagerId: commonSchemas.id.optional(),
    buildingId: commonSchemas.id.optional(),
    floorId: commonSchemas.id.optional(),
    workstation: commonSchemas.text(0, 100).optional(),
    joiningDate: commonSchemas.date,
    emergencyContact: z.object({
      name: commonSchemas.text(1, 100),
      phone: commonSchemas.phone,
      relation: commonSchemas.text(1, 50)
    }).optional()
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.password,
    confirmPassword: z.string().min(1, 'Password confirmation is required')
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  
  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: commonSchemas.password,
    confirmPassword: z.string().min(1, 'Password confirmation is required')
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }),
  
  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
};

// Employee validation schemas
const employeeSchemas = {
  create: z.object({
    employeeId: commonSchemas.employeeId,
    username: commonSchemas.username,
    email: commonSchemas.email,
    firstName: commonSchemas.text(1, 100),
    lastName: commonSchemas.text(1, 100),
    phone: commonSchemas.phone,
    role: commonSchemas.role.default('employee'),
    status: commonSchemas.userStatus.default('active'),
    departmentId: commonSchemas.id.optional(),
    designation: commonSchemas.text(0, 255).optional(),
    reportingManagerId: commonSchemas.id.optional(),
    buildingId: commonSchemas.id.optional(),
    floorId: commonSchemas.id.optional(),
    workstation: commonSchemas.text(0, 100).optional(),
    joiningDate: commonSchemas.date,
    emergencyContact: z.object({
      name: commonSchemas.text(1, 100),
      phone: commonSchemas.phone,
      relation: commonSchemas.text(1, 50)
    }).optional(),
    permissions: commonSchemas.arrayOfStrings.default([])
  }),
  
  update: z.object({
    firstName: commonSchemas.text(1, 100).optional(),
    lastName: commonSchemas.text(1, 100).optional(),
    phone: commonSchemas.phone,
    designation: commonSchemas.text(0, 255).optional(),
    reportingManagerId: commonSchemas.id.optional(),
    buildingId: commonSchemas.id.optional(),
    floorId: commonSchemas.id.optional(),
    workstation: commonSchemas.text(0, 100).optional(),
    status: commonSchemas.userStatus.optional(),
    emergencyContact: z.object({
      name: commonSchemas.text(1, 100),
      phone: commonSchemas.phone,
      relation: commonSchemas.text(1, 50)
    }).optional(),
    permissions: commonSchemas.arrayOfStrings.optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
};

// Room booking validation schemas
const bookingSchemas = {
  create: z.object({
    roomId: commonSchemas.id,
    title: commonSchemas.text(1, 255),
    description: commonSchemas.text(0, 1000).optional(),
    startTime: commonSchemas.dateTime,
    endTime: commonSchemas.dateTime,
    attendees: z.array(z.object({
      id: commonSchemas.id.optional(),
      name: commonSchemas.text(1, 100),
      email: commonSchemas.email.optional()
    })).optional().default([]),
    isRecurring: z.boolean().default(false),
    recurrencePattern: z.object({
      frequency: z.enum(['daily', 'weekly', 'monthly']),
      interval: commonSchemas.positiveInteger,
      endDate: commonSchemas.date.optional()
    }).optional()
  }).refine(data => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"]
  }),
  
  update: z.object({
    title: commonSchemas.text(1, 255).optional(),
    description: commonSchemas.text(0, 1000).optional(),
    startTime: commonSchemas.dateTime.optional(),
    endTime: commonSchemas.dateTime.optional(),
    attendees: z.array(z.object({
      id: commonSchemas.id.optional(),
      name: commonSchemas.text(1, 100),
      email: commonSchemas.email.optional()
    })).optional(),
    status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
};

// Visitor management validation schemas
const visitorSchemas = {
  create: z.object({
    name: commonSchemas.text(1, 255),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone,
    company: commonSchemas.text(0, 255).optional(),
    purpose: commonSchemas.text(1, 1000),
    hostEmployeeId: commonSchemas.id,
    visitDate: commonSchemas.date,
    expectedArrival: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    expectedDeparture: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    idProofType: z.enum(['passport', 'driving_license', 'national_id', 'other']).optional(),
    idProofNumber: commonSchemas.text(0, 100).optional(),
    accessAreas: commonSchemas.arrayOfStrings.default([])
  }),
  
  update: z.object({
    name: commonSchemas.text(1, 255).optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
    company: commonSchemas.text(0, 255).optional(),
    purpose: commonSchemas.text(1, 1000).optional(),
    expectedArrival: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    expectedDeparture: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').optional(),
    status: z.enum(['pending', 'approved', 'checked_in', 'checked_out', 'rejected']).optional(),
    securityNotes: commonSchemas.text(0, 1000).optional(),
    accessAreas: commonSchemas.arrayOfStrings.optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
};

// Asset management validation schemas
const assetSchemas = {
  create: z.object({
    assetTag: z.string().min(1, 'Asset tag is required').max(100, 'Asset tag too long'),
    name: commonSchemas.text(1, 255),
    category: z.enum(['laptop', 'desktop', 'monitor', 'phone', 'furniture', 'vehicle', 'other']),
    brand: commonSchemas.text(0, 100).optional(),
    model: commonSchemas.text(0, 100).optional(),
    serialNumber: commonSchemas.text(0, 255).optional(),
    purchaseDate: commonSchemas.date.optional(),
    purchaseCost: commonSchemas.decimal(2).optional(),
    warrantyExpiry: commonSchemas.date.optional(),
    assignedTo: commonSchemas.id.optional(),
    location: commonSchemas.text(0, 255).optional(),
    condition: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
    specifications: commonSchemas.jsonObject.default({})
  }),
  
  update: z.object({
    name: commonSchemas.text(1, 255).optional(),
    category: z.enum(['laptop', 'desktop', 'monitor', 'phone', 'furniture', 'vehicle', 'other']).optional(),
    brand: commonSchemas.text(0, 100).optional(),
    model: commonSchemas.text(0, 100).optional(),
    serialNumber: commonSchemas.text(0, 255).optional(),
    assignedTo: commonSchemas.id.optional(),
    location: commonSchemas.text(0, 255).optional(),
    status: z.enum(['available', 'assigned', 'maintenance', 'retired', 'lost']).optional(),
    condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
    specifications: commonSchemas.jsonObject.optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
};

// Leave management validation schemas
const leaveSchemas = {
  create: z.object({
    leaveType: z.enum(['casual', 'sick', 'earned', 'maternity', 'paternity', 'emergency']),
    startDate: commonSchemas.date,
    endDate: commonSchemas.date,
    reason: commonSchemas.text(1, 1000),
    emergencyContact: z.object({
      name: commonSchemas.text(1, 100),
      phone: commonSchemas.phone
    }).optional()
  }).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"]
  }),
  
  updateStatus: z.object({
    status: z.enum(['approved', 'rejected']),
    rejectionReason: commonSchemas.text(1, 1000).optional()
  }).refine(data => {
    if (data.status === 'rejected' && !data.rejectionReason) {
      return false;
    }
    return true;
  }, {
    message: "Rejection reason is required when rejecting leave",
    path: ["rejectionReason"]
  })
};

// Schedule validation schemas
const scheduleSchemas = {
  create: z.object({
    title: commonSchemas.text(1, 255),
    content: commonSchemas.safeHtml(5000),
    type: z.enum(['announcement', 'schedule', 'event', 'maintenance']).default('announcement'),
    startTime: commonSchemas.dateTime,
    endTime: commonSchemas.dateTime,
    priority: commonSchemas.priority.default('medium'),
    targetAudience: z.array(z.enum(['all', 'employees', 'managers', 'hr', 'security'])).default(['all']),
    isActive: z.boolean().default(true)
  }).refine(data => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"]
  }),
  
  update: z.object({
    title: commonSchemas.text(1, 255).optional(),
    content: commonSchemas.safeHtml(5000).optional(),
    type: z.enum(['announcement', 'schedule', 'event', 'maintenance']).optional(),
    startTime: commonSchemas.dateTime.optional(),
    endTime: commonSchemas.dateTime.optional(),
    priority: commonSchemas.priority.optional(),
    targetAudience: z.array(z.enum(['all', 'employees', 'managers', 'hr', 'security'])).optional(),
    isActive: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
};

// Announcement validation schemas
const announcementSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
    priority: commonSchemas.priority.default('medium'),
    expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid expiration date').optional(),
    isActive: z.boolean().default(true)
  }),
  
  update: z.object({
    title: z.string().min(1).max(200).optional(),
    content: z.string().min(1).max(2000).optional(),
    priority: commonSchemas.priority.optional(),
    expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid expiration date').optional(),
    isActive: z.boolean().optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
};

// Task validation schemas
const taskSchemas = {
  create: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    priority: commonSchemas.priority.default('medium'),
    status: commonSchemas.status.default('pending'),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid due date').optional(),
    assignedTo: z.string().optional()
  }),
  
  update: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    priority: commonSchemas.priority.optional(),
    status: commonSchemas.status.optional(),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid due date').optional(),
    assignedTo: z.string().optional()
  }).refine(data => Object.keys(data).length > 0, 'At least one field must be provided')
};

// Validation middleware factory
function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = source === 'params' ? req.params : 
                   source === 'query' ? req.query : req.body;
      
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        logger.warn('Validation failed', {
          url: req.url,
          method: req.method,
          errors,
          data: source !== 'body' ? data : '[REDACTED]'
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }
      
      // Replace the original data with validated data
      if (source === 'params') req.params = result.data;
      else if (source === 'query') req.query = result.data;
      else req.body = result.data;
      
      next();
    } catch (error) {
      logger.error('Validation middleware error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      
      res.status(500).json({ error: 'Internal validation error' });
    }
  };
}

// Enhanced sanitization middleware with XSS protection
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove dangerous HTML tags and scripts
      return DOMPurify.sanitize(obj.trim(), {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });
    }
    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };
  
  // Sanitize all input sources
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
}

// Rate limiting validation
function validateRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const key = `rate_limit:${identifier}`;
    
    // This would typically use Redis in production
    // For now, we'll use a simple in-memory store
    if (!global.rateLimitStore) {
      global.rateLimitStore = new Map();
    }
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, data] of global.rateLimitStore.entries()) {
      if (data.timestamp < windowStart) {
        global.rateLimitStore.delete(key);
      }
    }
    
    const current = global.rateLimitStore.get(key) || { count: 0, timestamp: now };
    
    if (current.timestamp < windowStart) {
      current.count = 1;
      current.timestamp = now;
    } else {
      current.count++;
    }
    
    global.rateLimitStore.set(key, current);
    
    if (current.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        ip: identifier,
        count: current.count,
        maxRequests,
        url: req.url
      });
      
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 60000} minutes.`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - current.count),
      'X-RateLimit-Reset': new Date(current.timestamp + windowMs).toISOString()
    });
    
    next();
  };
}

// File upload validation
function validateFileUpload(options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    required = false
  } = options;
  
  return (req, res, next) => {
    if (!req.files || Object.keys(req.files).length === 0) {
      if (required) {
        return res.status(400).json({
          error: 'File upload required',
          message: 'At least one file must be uploaded'
        });
      }
      return next();
    }
    
    const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
    
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: 'File too large',
          message: `File size must not exceed ${maxSize / (1024 * 1024)}MB`,
          filename: file.name
        });
      }
      
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Invalid file type',
          message: `File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
          filename: file.name
        });
      }
      
      // Additional security checks
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.jar'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (dangerousExtensions.includes(fileExtension)) {
        return res.status(400).json({
          error: 'Dangerous file type',
          message: 'This file type is not allowed for security reasons',
          filename: file.name
        });
      }
    }
    
    next();
  };
}

// Query parameter validation
function validateQueryParams(schema) {
  return validateRequest(schema, 'query');
}

// Path parameter validation
function validatePathParams(schema) {
  return validateRequest(schema, 'params');
}

// Pagination validation
const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1)
    .refine(val => val > 0, 'Page must be positive'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  search: z.string().optional().transform(val => val ? val.trim() : undefined)
});

function validatePagination() {
  return validateQueryParams(paginationSchema);
}

module.exports = {
  validateRequest,
  sanitizeInput,
  validateRateLimit,
  validateFileUpload,
  validateQueryParams,
  validatePathParams,
  validatePagination,
  authSchemas,
  employeeSchemas,
  bookingSchemas,
  visitorSchemas,
  assetSchemas,
  leaveSchemas,
  scheduleSchemas,
  announcementSchemas,
  taskSchemas,
  commonSchemas,
  paginationSchema
};
