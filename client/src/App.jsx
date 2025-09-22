import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Display from './pages/Display'
import Admin from './pages/Admin'
import HRDashboard from './pages/HRDashboard'
import EmployeeManagement from './components/EmployeeManagement'
import RoomBooking from './components/RoomBooking'
import VisitorManagement from './components/VisitorManagement'
import AssetManagement from './components/AssetManagement'
import AttendanceManagement from './components/AttendanceManagement'
import LeaveManagement from './components/LeaveManagement'
import Reports from './components/Reports'
import NotificationCenter from './components/NotificationCenter'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Routes>
          {/* Public routes */}
          <Route path="/display" element={<Display />} />
          
          {/* Auth routes - redirect to appropriate dashboard if already logged in */}
          <Route path="/login" element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          } />
          <Route path="/register" element={
            <ProtectedRoute requireAuth={false}>
              <Register />
            </ProtectedRoute>
          } />
          
          {/* Protected routes - Original LiveBoard features */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          } />
          
          {/* Enterprise HR Management Routes */}
          <Route path="/hr-dashboard" element={
            <ProtectedRoute requiredRoles={['admin', 'hr']}>
              <HRDashboard />
            </ProtectedRoute>
          } />
          <Route path="/employees" element={
            <ProtectedRoute requiredRoles={['admin', 'hr', 'manager']}>
              <EmployeeManagement />
            </ProtectedRoute>
          } />
          <Route path="/bookings" element={
            <ProtectedRoute>
              <RoomBooking />
            </ProtectedRoute>
          } />
          <Route path="/visitors" element={
            <ProtectedRoute>
              <VisitorManagement />
            </ProtectedRoute>
          } />
          <Route path="/assets" element={
            <ProtectedRoute requiredRoles={['admin', 'hr', 'manager']}>
              <AssetManagement />
            </ProtectedRoute>
          } />
          <Route path="/attendance" element={
            <ProtectedRoute>
              <AttendanceManagement />
            </ProtectedRoute>
          } />
          <Route path="/leaves" element={
            <ProtectedRoute>
              <LeaveManagement />
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute requiredRoles={['admin', 'hr', 'manager']}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          } />
          
          {/* Default redirect based on user role */}
          <Route path="/" element={
            <ProtectedRoute requireAuth={false}>
              <Navigate to="/login" replace />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
