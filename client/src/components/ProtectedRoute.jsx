import React, { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { AlertTriangle } from 'lucide-react'

export default function ProtectedRoute({ children, requireAuth = true, requiredRoles = [] }) {
  const { user, loading } = useContext(AuthContext)
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!requireAuth && user) {
    // Redirect based on user role
    if (user.role === 'admin' || user.role === 'hr') {
      return <Navigate to="/hr-dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  // Check role-based access
  if (requireAuth && requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
            <div className="mx-auto h-16 w-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-4">
              Access Denied
            </h1>
            
            <p className="text-slate-400 mb-6">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
            
            <div className="text-sm text-slate-500 mb-6">
              <p>Your role: <span className="text-brand-500 font-medium capitalize">{user?.role}</span></p>
              <p>Required roles: <span className="text-orange-400 font-medium">{requiredRoles.join(', ')}</span></p>
            </div>
            
            <button
              onClick={() => window.history.back()}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return children
}
