// Application Configuration
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

// API Configuration
const defaultOrigin = typeof window !== 'undefined' ? window.location.origin : '';
export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultOrigin;
export const WS_URL = import.meta.env.VITE_WS_URL || API_BASE_URL;

// Environment
export const ENV = {
  isDevelopment,
  isProduction,
  mode: import.meta.env.MODE,
};

// Feature Flags
export const FEATURES = {
  enableWebSocket: import.meta.env.VITE_ENABLE_WEBSOCKET !== 'false',
  enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE !== 'false',
  enableDebugMode: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
};

// App Configuration
export const APP_CONFIG = {
  name: 'LiveBoard',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@liveboard.com',
};

// Storage Keys
export const STORAGE_KEYS = {
  token: 'liveboard_token',
  user: 'liveboard_user',
  theme: 'liveboard_theme',
  language: 'liveboard_language',
  scheduleCache: 'liveboard_schedule_cache',
  announcementCache: 'liveboard_announcement_cache',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  login: '/api/auth/login',
  register: '/api/auth/register',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
  refresh: '/api/auth/refresh',
  
  // Schedule
  schedule: '/api/schedule',
  
  // Announcements
  announcements: '/api/announcements',
  
  // Tasks
  tasks: '/api/tasks',
  
  // Dashboard
  dashboard: '/api/dashboard/stats',
  
  // Enterprise
  employees: '/api/enterprise/employees',
  visitors: '/api/enterprise/visitors',
  bookings: '/api/enterprise/bookings',
  assets: '/api/enterprise/assets',
  attendance: '/api/enterprise/attendance',
  leaves: '/api/enterprise/leaves',
  notifications: '/api/enterprise/notifications',
  reports: '/api/enterprise/reports',
};

// Timeouts
export const TIMEOUTS = {
  api: 10000, // 10 seconds
  websocket: 5000, // 5 seconds
  reconnect: 3000, // 3 seconds
  debounce: 300, // 300ms
  throttle: 1000, // 1 second
};

// Pagination
export const PAGINATION = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 25, 50, 100],
};

// Date Formats
export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  displayTime: 'MMM dd, yyyy HH:mm',
  input: 'yyyy-MM-dd',
  time: 'HH:mm',
  api: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
};

// Validation Rules
export const VALIDATION = {
  password: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    pattern: /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
    message: 'Please enter a valid phone number',
  },
};

// Error Messages
export const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  server: 'Server error. Please try again later.',
  unauthorized: 'Session expired. Please login again.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  validation: 'Please check your input and try again.',
  timeout: 'Request timeout. Please try again.',
  unknown: 'An unexpected error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  login: 'Login successful!',
  logout: 'Logout successful!',
  save: 'Changes saved successfully!',
  create: 'Created successfully!',
  update: 'Updated successfully!',
  delete: 'Deleted successfully!',
  upload: 'Upload successful!',
};

export default {
  API_BASE_URL,
  WS_URL,
  ENV,
  FEATURES,
  APP_CONFIG,
  STORAGE_KEYS,
  API_ENDPOINTS,
  TIMEOUTS,
  PAGINATION,
  DATE_FORMATS,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
