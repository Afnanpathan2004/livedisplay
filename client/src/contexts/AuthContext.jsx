import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import apiService from '../services/api';
import config from '../config';

export const AuthContext = createContext(null);

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(config.STORAGE_KEYS.token);
        const savedUser = localStorage.getItem(config.STORAGE_KEYS.user);

        if (token && savedUser) {
          // Verify token is still valid
          try {
            const { data } = await apiService.auth.me();
            setUser(data.user);
            setIsAuthenticated(true);
          } catch (error) {
            // Token invalid, clear storage
            localStorage.removeItem(config.STORAGE_KEYS.token);
            localStorage.removeItem(config.STORAGE_KEYS.user);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const { data } = await apiService.auth.login({ username, password });
      
      if (data.token && data.user) {
        localStorage.setItem(config.STORAGE_KEYS.token, data.token);
        localStorage.setItem(config.STORAGE_KEYS.user, JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return data.user;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || config.ERROR_MESSAGES.network);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      const { data } = await apiService.auth.register(userData);
      
      if (data.token && data.user) {
        localStorage.setItem(config.STORAGE_KEYS.token, data.token);
        localStorage.setItem(config.STORAGE_KEYS.user, JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return data.user;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Attempt to call logout endpoint (don't wait for it)
      apiService.auth.logout().catch(() => {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem(config.STORAGE_KEYS.token);
      localStorage.removeItem(config.STORAGE_KEYS.user);
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(config.STORAGE_KEYS.user, JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
