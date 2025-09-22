const { z } = require('zod');
const { logger } = require('../utils/logger');

// Common validation schemas
const commonSchemas = {
  id: z.string().min(1, 'ID is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long'),
  role: z.enum(['admin', 'editor', 'viewer'], { errorMap: () => ({ message: 'Invalid role' }) }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date format'),
  priority: z.enum(['low', 'medium', 'high'], { errorMap: () => ({ message: 'Invalid priority' }) }),
  status: z.enum(['pending', 'in_progress', 'completed'], { errorMap: () => ({ message: 'Invalid status' }) })
};

// Auth validation schemas
const authSchemas = {
  login: z.object({
    username: commonSchemas.username,
    password: z.string().min(1, 'Password is required')
  }),
  
  register: z.object({
    username: commonSchemas.username,
    email: commonSchemas.email,
    password: commonSchemas.password,
    role: commonSchemas.role.optional().default('viewer')
  })
};

// Schedule validation schemas
const scheduleSchemas = {
  create: z.object({
    date: commonSchemas.date,
    timeSlot: z.string().min(1, 'Time slot is required'),
    subject: z.string().min(1, 'Subject is required').max(100, 'Subject too long'),
    teacher: z.string().min(1, 'Teacher is required').max(100, 'Teacher name too long'),
    room: z.string().max(50, 'Room name too long').optional(),
    notes: z.string().max(500, 'Notes too long').optional(),
    type: z.enum(['regular', 'exam', 'lab', 'special']).default('regular')
  }),
  
  update: z.object({
    date: commonSchemas.date.optional(),
    timeSlot: z.string().min(1).optional(),
    subject: z.string().min(1).max(100).optional(),
    teacher: z.string().min(1).max(100).optional(),
    room: z.string().max(50).optional(),
    notes: z.string().max(500).optional(),
    type: z.enum(['regular', 'exam', 'lab', 'special']).optional()
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

// Sanitization middleware
function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  next();
}

module.exports = {
  validateRequest,
  sanitizeInput,
  authSchemas,
  scheduleSchemas,
  announcementSchemas,
  taskSchemas,
  commonSchemas
};
