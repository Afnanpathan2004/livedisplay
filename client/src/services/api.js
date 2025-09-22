import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    
    if (error.response?.status === 403) {
      return Promise.reject(new Error('You do not have permission to perform this action.'));
    }
    
    if (error.response?.status === 404) {
      return Promise.reject(new Error('The requested resource was not found.'));
    }
    
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please check your connection.'));
    }
    
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Return the original error message from the server
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    return Promise.reject(new Error(message));
  }
);

// API service methods
export const apiService = {
  // Generic methods
  get: (url, config = {}) => api.get(url, config),
  post: (url, data, config = {}) => api.post(url, data, config),
  put: (url, data, config = {}) => api.put(url, data, config),
  patch: (url, data, config = {}) => api.patch(url, data, config),
  delete: (url, config = {}) => api.delete(url, config),

  // Auth methods
  auth: {
    login: (credentials) => api.post('/api/auth/login', credentials),
    register: (userData) => api.post('/api/auth/register', userData),
    me: () => api.get('/api/auth/me'),
    logout: () => api.post('/api/auth/logout'),
  },

  // Employee methods
  employees: {
    getAll: (params = {}) => api.get('/api/employees', { params }),
    getById: (id) => api.get(`/api/employees/${id}`),
    create: (data) => api.post('/api/employees', data),
    update: (id, data) => api.put(`/api/employees/${id}`, data),
    delete: (id) => api.delete(`/api/employees/${id}`),
    getStats: () => api.get('/api/employees/stats'),
  },

  // Booking methods
  bookings: {
    getAll: (params = {}) => api.get('/api/bookings', { params }),
    getById: (id) => api.get(`/api/bookings/${id}`),
    create: (data) => api.post('/api/bookings', data),
    update: (id, data) => api.put(`/api/bookings/${id}`, data),
    delete: (id) => api.delete(`/api/bookings/${id}`),
    approve: (id) => api.patch(`/api/bookings/${id}/approve`),
    reject: (id, reason) => api.patch(`/api/bookings/${id}/reject`, { reason }),
    getStats: () => api.get('/api/bookings/stats'),
  },

  // Visitor methods
  visitors: {
    getAll: (params = {}) => api.get('/api/visitors', { params }),
    getById: (id) => api.get(`/api/visitors/${id}`),
    create: (data) => api.post('/api/visitors', data),
    update: (id, data) => api.put(`/api/visitors/${id}`, data),
    delete: (id) => api.delete(`/api/visitors/${id}`),
    checkIn: (id) => api.patch(`/api/visitors/${id}/checkin`),
    checkOut: (id) => api.patch(`/api/visitors/${id}/checkout`),
    approve: (id) => api.patch(`/api/visitors/${id}/approve`),
    reject: (id, reason) => api.patch(`/api/visitors/${id}/reject`, { reason }),
    getStats: () => api.get('/api/visitors/stats'),
  },

  // Asset methods
  assets: {
    getAll: (params = {}) => api.get('/api/assets', { params }),
    getById: (id) => api.get(`/api/assets/${id}`),
    create: (data) => api.post('/api/assets', data),
    update: (id, data) => api.put(`/api/assets/${id}`, data),
    delete: (id) => api.delete(`/api/assets/${id}`),
    assign: (id, employeeId) => api.patch(`/api/assets/${id}/assign`, { employeeId }),
    unassign: (id) => api.patch(`/api/assets/${id}/unassign`),
    maintenance: (id, data) => api.patch(`/api/assets/${id}/maintenance`, data),
    getStats: () => api.get('/api/assets/stats'),
  },

  // Attendance methods
  attendance: {
    getAll: (params = {}) => api.get('/api/attendance', { params }),
    getById: (id) => api.get(`/api/attendance/${id}`),
    create: (data) => api.post('/api/attendance', data),
    update: (id, data) => api.put(`/api/attendance/${id}`, data),
    delete: (id) => api.delete(`/api/attendance/${id}`),
    getDepartmentStats: (params = {}) => api.get('/api/attendance/department-stats', { params }),
    markAttendance: (data) => api.post('/api/attendance/mark', data),
  },

  // Leave methods
  leaves: {
    getAll: (params = {}) => api.get('/api/leaves', { params }),
    getById: (id) => api.get(`/api/leaves/${id}`),
    create: (data) => api.post('/api/leaves', data),
    update: (id, data) => api.put(`/api/leaves/${id}`, data),
    delete: (id) => api.delete(`/api/leaves/${id}`),
    approve: (id, data) => api.patch(`/api/leaves/${id}/approve`, data),
    reject: (id, reason) => api.patch(`/api/leaves/${id}/reject`, { reason }),
    cancel: (id) => api.patch(`/api/leaves/${id}/cancel`),
    getStats: () => api.get('/api/leaves/stats'),
  },

  // Notification methods
  notifications: {
    getAll: (params = {}) => api.get('/api/notifications', { params }),
    getById: (id) => api.get(`/api/notifications/${id}`),
    create: (data) => api.post('/api/notifications', data),
    markAsRead: (id) => api.patch(`/api/notifications/${id}/read`),
    markAsUnread: (id) => api.patch(`/api/notifications/${id}/unread`),
    markAllAsRead: () => api.patch('/api/notifications/mark-all-read'),
    delete: (id) => api.delete(`/api/notifications/${id}`),
    getStats: () => api.get('/api/notifications/stats'),
  },

  // Report methods
  reports: {
    get: (type, params = {}) => api.get(`/api/reports/${type}`, { params }),
    export: (params = {}) => api.get('/api/reports/export', { 
      params, 
      responseType: 'blob' 
    }),
  },

  // Original LiveBoard methods
  schedule: {
    getAll: (params = {}) => api.get('/api/schedule', { params }),
    create: (data) => api.post('/api/schedule', data),
    update: (id, data) => api.put(`/api/schedule/${id}`, data),
    delete: (id) => api.delete(`/api/schedule/${id}`),
  },

  announcements: {
    getAll: (params = {}) => api.get('/api/announcements', { params }),
    create: (data) => api.post('/api/announcements', data),
    update: (id, data) => api.put(`/api/announcements/${id}`, data),
    delete: (id) => api.delete(`/api/announcements/${id}`),
  },

  tasks: {
    getAll: (params = {}) => api.get('/api/tasks', { params }),
    create: (data) => api.post('/api/tasks', data),
    update: (id, data) => api.put(`/api/tasks/${id}`, data),
    delete: (id) => api.delete(`/api/tasks/${id}`),
  },
};

// Utility functions
export const handleApiError = (error, showToast = true) => {
  const message = error.message || 'An unexpected error occurred';
  
  if (showToast && typeof window !== 'undefined' && window.showToast) {
    window.showToast(message, 'error');
  }
  
  console.error('API Error:', error);
  return message;
};

export const createFormData = (data) => {
  const formData = new FormData();
  
  Object.keys(data).forEach(key => {
    if (data[key] !== null && data[key] !== undefined) {
      if (Array.isArray(data[key])) {
        data[key].forEach((item, index) => {
          formData.append(`${key}[${index}]`, item);
        });
      } else if (data[key] instanceof File) {
        formData.append(key, data[key]);
      } else {
        formData.append(key, data[key].toString());
      }
    }
  });
  
  return formData;
};

export default api;
