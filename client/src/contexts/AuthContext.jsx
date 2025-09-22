import React, { createContext, useState, useEffect, useContext } from 'react'
import { apiService, handleApiError } from '../services/api'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    if (token) {
      // Verify token validity
      verifyToken()
    } else {
      setLoading(false)
    }
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await apiService.auth.me()
      setUser(response.data)
    } catch (error) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      const response = await apiService.auth.login({ username, password })
      const { token: newToken, user: userData } = response.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      if (window.showSuccess) {
        window.showSuccess(`Welcome back, ${userData.firstName || userData.username}!`)
      }
      
      return userData
    } catch (error) {
      const errorMessage = handleApiError(error, false)
      throw new Error(errorMessage)
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await apiService.auth.register({ username, email, password })
      const { token: newToken, user: userData } = response.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      if (window.showSuccess) {
        window.showSuccess(`Welcome to LiveDisplay, ${userData.firstName || userData.username}!`)
      }
      
      return userData
    } catch (error) {
      const errorMessage = handleApiError(error, false)
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    
    if (window.showInfo) {
      window.showInfo('You have been logged out successfully.')
    }
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
