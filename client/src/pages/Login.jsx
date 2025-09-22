import { useState, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { useFormValidation, commonSchemas } from '../utils/validation'

export default function Login() {
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  const onSubmit = async (formData) => {
    setError('')
    
    try {
      const userData = await login(formData.username, formData.password)
      
      // Redirect based on user role and intended destination
      const from = location.state?.from?.pathname || getDefaultRoute(userData.role)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
      throw err // Re-throw to prevent form from thinking submission was successful
    }
  }

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit
  } = useFormValidation(
    { username: '', password: '' },
    commonSchemas.login
  )

  const getDefaultRoute = (role) => {
    switch (role) {
      case 'admin':
      case 'hr':
        return '/hr-dashboard'
      case 'manager':
        return '/hr-dashboard'
      default:
        return '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-ping delay-2000"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/25 animate-bounce">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent mb-2">
            LiveBoard
          </h1>
          <p className="text-xl font-semibold text-blue-300 mb-1">Enterprise Office Management</p>
          <p className="text-slate-400">Sign in to access your dashboard</p>
        </div>

        <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl shadow-black/50 hover:shadow-blue-500/10 transition-all duration-500">
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmit)
          }}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="group">
              <label htmlFor="username" className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Username
                </span>
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={values.username}
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  onBlur={(e) => handleBlur(e.target.name)}
                  className="w-full px-4 py-4 bg-slate-700/30 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-slate-700/50 transition-all duration-300 hover:border-slate-500"
                  placeholder="Enter your username"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-cyan-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-cyan-500/5 pointer-events-none transition-all duration-300"></div>
              </div>
              {touched.username && errors.username && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.username}
                </p>
              )}
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors">
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={values.password}
                  onChange={(e) => handleChange(e.target.name, e.target.value)}
                  onBlur={(e) => handleBlur(e.target.name)}
                  className="w-full px-4 py-4 bg-slate-700/30 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-slate-700/50 transition-all duration-300 hover:border-slate-500"
                  placeholder="Enter your password"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-cyan-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-cyan-500/5 pointer-events-none transition-all duration-300"></div>
              </div>
              {touched.password && errors.password && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-cyan-400/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In to Dashboard
                  </>
                )}
              </div>
            </button>

            <div className="text-center space-y-4">
              <div className="flex items-center">
                <div className="flex-1 border-t border-slate-600"></div>
                <span className="px-4 text-slate-400 text-sm">or</span>
                <div className="flex-1 border-t border-slate-600"></div>
              </div>
              
              <p className="text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors hover:underline">
                  Create Account
                </Link>
              </p>
              
              <div className="mt-6 pt-6 border-t border-slate-700">
                <p className="text-xs text-slate-500 text-center">
                  Demo Credentials: <span className="text-blue-400 font-mono">admin / admin123</span>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
