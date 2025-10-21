import axios from 'axios';
import appConfig from '../config';

// Function to handle API errors
export const handleApiError = (error, showToast = true) => {
  let message = 'An unexpected error occurred';

  if (error.response) {
    // Server responded with error status
    message = error.response.data?.error || error.response.data?.message || appConfig.ERROR_MESSAGES.server;
  } else if (error.request) {
    // Network error
    message = appConfig.ERROR_MESSAGES.network;
  } else {
    // Other error
    message = error.message || appConfig.ERROR_MESSAGES.unknown;
  }

  if (showToast && window.showError) {
    window.showError(message);
  }

  return message;
};

// Function to create axios instances with custom options
export const createAxiosInstance = (options = {}) => {
  const instance = axios.create({
    baseURL: options.API_BASE_URL || appConfig.API_BASE_URL,
    timeout: (options.TIMEOUTS?.api) ?? appConfig.TIMEOUTS.api,
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (request) => {
      const token = localStorage.getItem(appConfig.STORAGE_KEYS.token);
      if (token) {
        request.headers.Authorization = `Bearer ${token}`;
      }
      return request;
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

// Create display-specific API instance (no client-side secret headers)
export const displayApi = axios.create({
  baseURL: appConfig.API_BASE_URL,
  timeout: appConfig.TIMEOUTS.api,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create authenticated API instance for apiService
const authApi = createAxiosInstance(appConfig);
const scheduleApi = createAxiosInstance(appConfig);
const announcementsApi = createAxiosInstance(appConfig);
const tasksApi = createAxiosInstance(appConfig);
const dashboardApi = createAxiosInstance(appConfig);
const enterpriseApi = createAxiosInstance(appConfig);

// API Service object with organized endpoints
export const apiService = {
  auth: {
    login: (credentials) => authApi.post(appConfig.API_ENDPOINTS.login, credentials),
    register: (userData) => authApi.post(appConfig.API_ENDPOINTS.register, userData),
    me: () => authApi.get(appConfig.API_ENDPOINTS.me),
    logout: () => authApi.post(appConfig.API_ENDPOINTS.logout),
    refresh: () => authApi.post(appConfig.API_ENDPOINTS.refresh),
  },
  schedule: {
    getAll: (params) => scheduleApi.get(appConfig.API_ENDPOINTS.schedule, { params }),
    getById: (id) => scheduleApi.get(`${appConfig.API_ENDPOINTS.schedule}/${id}`),
    create: (data) => scheduleApi.post(appConfig.API_ENDPOINTS.schedule, data),
    update: (id, data) => scheduleApi.put(`${appConfig.API_ENDPOINTS.schedule}/${id}`, data),
    delete: (id) => scheduleApi.delete(`${appConfig.API_ENDPOINTS.schedule}/${id}`),
  },
  announcements: {
    getAll: () => announcementsApi.get(appConfig.API_ENDPOINTS.announcements),
    getById: (id) => announcementsApi.get(`${appConfig.API_ENDPOINTS.announcements}/${id}`),
    create: (data) => announcementsApi.post(appConfig.API_ENDPOINTS.announcements, data),
    update: (id, data) => announcementsApi.put(`${appConfig.API_ENDPOINTS.announcements}/${id}`, data),
    delete: (id) => announcementsApi.delete(`${appConfig.API_ENDPOINTS.announcements}/${id}`),
  },
  tasks: {
    getAll: (params) => tasksApi.get(appConfig.API_ENDPOINTS.tasks, { params }),
    getById: (id) => tasksApi.get(`${appConfig.API_ENDPOINTS.tasks}/${id}`),
    create: (data) => tasksApi.post(appConfig.API_ENDPOINTS.tasks, data),
    update: (id, data) => tasksApi.put(`${appConfig.API_ENDPOINTS.tasks}/${id}`, data),
    delete: (id) => tasksApi.delete(`${appConfig.API_ENDPOINTS.tasks}/${id}`),
  },
  dashboard: {
    getStats: () => dashboardApi.get(appConfig.API_ENDPOINTS.dashboard),
  },
  enterprise: {
    employees: {
      getAll: (params) => enterpriseApi.get(appConfig.API_ENDPOINTS.employees, { params }),
      getById: (id) => enterpriseApi.get(`${appConfig.API_ENDPOINTS.employees}/${id}`),
      create: (data) => enterpriseApi.post(appConfig.API_ENDPOINTS.employees, data),
      update: (id, data) => enterpriseApi.put(`${appConfig.API_ENDPOINTS.employees}/${id}`, data),
      delete: (id) => enterpriseApi.delete(`${appConfig.API_ENDPOINTS.employees}/${id}`),
    },
    visitors: {
      getAll: (params) => enterpriseApi.get(appConfig.API_ENDPOINTS.visitors, { params }),
      create: (data) => enterpriseApi.post(appConfig.API_ENDPOINTS.visitors, data),
    },
    bookings: {
      getAll: (params) => enterpriseApi.get(appConfig.API_ENDPOINTS.bookings, { params }),
      create: (data) => enterpriseApi.post(appConfig.API_ENDPOINTS.bookings, data),
    },
    assets: {
      getAll: (params) => enterpriseApi.get(appConfig.API_ENDPOINTS.assets, { params }),
    },
    attendance: {
      getAll: (params) => enterpriseApi.get(appConfig.API_ENDPOINTS.attendance, { params }),
    },
    leaves: {
      getAll: (params) => enterpriseApi.get(appConfig.API_ENDPOINTS.leaves, { params }),
      create: (data) => enterpriseApi.post(appConfig.API_ENDPOINTS.leaves, data),
    },
    notifications: {
      getAll: (params) => enterpriseApi.get(appConfig.API_ENDPOINTS.notifications, { params }),
    },
    reports: {
      getAll: (params) => enterpriseApi.get(appConfig.API_ENDPOINTS.reports, { params }),
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
