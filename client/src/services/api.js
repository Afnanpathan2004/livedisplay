import axios from 'axios';
import config from '../config';

// Function to handle API errors
export const handleApiError = (error, showToast = true) => {
  let message = 'An unexpected error occurred';

  if (error.response) {
    // Server responded with error status
    message = error.response.data?.error || error.response.data?.message || config.ERROR_MESSAGES.server;
  } else if (error.request) {
    // Network error
    message = config.ERROR_MESSAGES.network;
  } else {
    // Other error
    message = error.message || config.ERROR_MESSAGES.unknown;
  }

  if (showToast && window.showError) {
    window.showError(message);
  }

  return message;
};

// Function to create axios instances with custom config
export const createAxiosInstance = (config = {}) => {
  const instance = axios.create({
    baseURL: config.API_BASE_URL,
    timeout: config.TIMEOUTS.api,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(config.STORAGE_KEYS.token);
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
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Handle common error scenarios
      if (error.response?.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem(config.STORAGE_KEYS.token);
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

  return instance;
};

// Create display-specific API instance
export const displayApi = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.TIMEOUTS.api,
  headers: {
    'Content-Type': 'application/json',
    'X-Display-Access': import.meta.env.VITE_DISPLAY_ACCESS_KEY || 'default_display_key'
  }
});

// Create authenticated API instance for apiService
const authApi = createAxiosInstance(config);
const scheduleApi = createAxiosInstance(config);
const announcementsApi = createAxiosInstance(config);
const tasksApi = createAxiosInstance(config);
const dashboardApi = createAxiosInstance(config);
const enterpriseApi = createAxiosInstance(config);

// API Service object with organized endpoints
export const apiService = {
  auth: {
    login: (credentials) => authApi.post(config.API_ENDPOINTS.login, credentials),
    register: (userData) => authApi.post(config.API_ENDPOINTS.register, userData),
    me: () => authApi.get(config.API_ENDPOINTS.me),
    logout: () => authApi.post(config.API_ENDPOINTS.logout),
    refresh: () => authApi.post(config.API_ENDPOINTS.refresh),
  },
  schedule: {
    getAll: (params) => scheduleApi.get(config.API_ENDPOINTS.schedule, { params }),
    getById: (id) => scheduleApi.get(`${config.API_ENDPOINTS.schedule}/${id}`),
    create: (data) => scheduleApi.post(config.API_ENDPOINTS.schedule, data),
    update: (id, data) => scheduleApi.put(`${config.API_ENDPOINTS.schedule}/${id}`, data),
    delete: (id) => scheduleApi.delete(`${config.API_ENDPOINTS.schedule}/${id}`),
  },
  announcements: {
    getAll: () => announcementsApi.get(config.API_ENDPOINTS.announcements),
    getById: (id) => announcementsApi.get(`${config.API_ENDPOINTS.announcements}/${id}`),
    create: (data) => announcementsApi.post(config.API_ENDPOINTS.announcements, data),
    update: (id, data) => announcementsApi.put(`${config.API_ENDPOINTS.announcements}/${id}`, data),
    delete: (id) => announcementsApi.delete(`${config.API_ENDPOINTS.announcements}/${id}`),
  },
  tasks: {
    getAll: (params) => tasksApi.get(config.API_ENDPOINTS.tasks, { params }),
    getById: (id) => tasksApi.get(`${config.API_ENDPOINTS.tasks}/${id}`),
    create: (data) => tasksApi.post(config.API_ENDPOINTS.tasks, data),
    update: (id, data) => tasksApi.put(`${config.API_ENDPOINTS.tasks}/${id}`, data),
    delete: (id) => tasksApi.delete(`${config.API_ENDPOINTS.tasks}/${id}`),
  },
  dashboard: {
    getStats: () => dashboardApi.get(config.API_ENDPOINTS.dashboard),
  },
  enterprise: {
    employees: {
      getAll: (params) => enterpriseApi.get(config.API_ENDPOINTS.employees, { params }),
      getById: (id) => enterpriseApi.get(`${config.API_ENDPOINTS.employees}/${id}`),
      create: (data) => enterpriseApi.post(config.API_ENDPOINTS.employees, data),
      update: (id, data) => enterpriseApi.put(`${config.API_ENDPOINTS.employees}/${id}`, data),
      delete: (id) => enterpriseApi.delete(`${config.API_ENDPOINTS.employees}/${id}`),
    },
    visitors: {
      getAll: (params) => enterpriseApi.get(config.API_ENDPOINTS.visitors, { params }),
      create: (data) => enterpriseApi.post(config.API_ENDPOINTS.visitors, data),
    },
    bookings: {
      getAll: (params) => enterpriseApi.get(config.API_ENDPOINTS.bookings, { params }),
      create: (data) => enterpriseApi.post(config.API_ENDPOINTS.bookings, data),
    },
    assets: {
      getAll: (params) => enterpriseApi.get(config.API_ENDPOINTS.assets, { params }),
    },
    attendance: {
      getAll: (params) => enterpriseApi.get(config.API_ENDPOINTS.attendance, { params }),
    },
    leaves: {
      getAll: (params) => enterpriseApi.get(config.API_ENDPOINTS.leaves, { params }),
      create: (data) => enterpriseApi.post(config.API_ENDPOINTS.leaves, data),
    },
    notifications: {
      getAll: (params) => enterpriseApi.get(config.API_ENDPOINTS.notifications, { params }),
    },
    reports: {
      getAll: (params) => enterpriseApi.get(config.API_ENDPOINTS.reports, { params }),
    },
  },
  settings: {
    getAll: () => enterpriseApi.get('/api/settings'),
    getCategory: (category) => enterpriseApi.get(`/api/settings/${category}`),
    update: (category, items) => enterpriseApi.put(`/api/settings/${category}`, { items }),
    addItem: (category, item) => enterpriseApi.post(`/api/settings/${category}/items`, { item }),
    removeItem: (category, item) => enterpriseApi.delete(`/api/settings/${category}/items/${encodeURIComponent(item)}`),
  },
  users: {
    getAll: () => authApi.get('/api/users'),
    getById: (id) => authApi.get(`/api/users/${id}`),
    create: (userData) => authApi.post('/api/users', userData),
    update: (id, userData) => authApi.put(`/api/users/${id}`, userData),
    delete: (id) => authApi.delete(`/api/users/${id}`),
    updateStatus: (id, status) => authApi.patch(`/api/users/${id}/status`, { status }),
    approve: (id) => authApi.post(`/api/users/${id}/approve`),
    reject: (id, reason) => authApi.post(`/api/users/${id}/reject`, { reason }),
  },
  bookings: {
    getAll: (params) => enterpriseApi.get('/api/bookings', { params }),
    getById: (id) => enterpriseApi.get(`/api/bookings/${id}`),
    create: (data) => enterpriseApi.post('/api/bookings', data),
    update: (id, data) => enterpriseApi.put(`/api/bookings/${id}`, data),
    delete: (id) => enterpriseApi.delete(`/api/bookings/${id}`),
    cancel: (id) => enterpriseApi.patch(`/api/bookings/${id}/cancel`),
    getByDate: (date) => enterpriseApi.get(`/api/bookings/date/${date}`),
    getByRoom: (room) => enterpriseApi.get(`/api/bookings/room/${encodeURIComponent(room)}`),
  },
};

// Export as default for easier importing
export default apiService;
