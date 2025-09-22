import React, { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import axios from 'axios'
import { format } from 'date-fns'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalSchedules: 0,
    todaySchedules: 0,
    activeAnnouncements: 0,
    pendingTasks: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      
      // Load schedules for today
      const schedulesRes = await axios.get(`${API}/api/schedule?date=${today}`)
      
      // Load announcements
      const announcementsRes = await axios.get(`${API}/api/announcements`)
      const activeAnnouncements = announcementsRes.data.filter(a => a.active)
      
      // Load tasks
      const tasksRes = await axios.get(`${API}/api/tasks?status=pending`)
      
      setStats({
        totalSchedules: schedulesRes.data.length,
        todaySchedules: schedulesRes.data.length,
        activeAnnouncements: activeAnnouncements.length,
        pendingTasks: tasksRes.data.length
      })

      // Mock recent activity
      setRecentActivity([
        { id: 1, action: 'Schedule created', details: 'Math class in Room 101', time: '2 minutes ago', type: 'schedule' },
        { id: 2, action: 'Announcement posted', details: 'Fire drill scheduled for tomorrow', time: '15 minutes ago', type: 'announcement' },
        { id: 3, action: 'Task completed', details: 'Clean projector in Room 205', time: '1 hour ago', type: 'task' },
        { id: 4, action: 'User logged in', details: user?.username || 'Unknown user', time: '2 hours ago', type: 'auth' }
      ])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-brand-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">LiveBoard Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/display"
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                View Display
              </Link>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-brand-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-900">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-slate-300">{user?.username}</span>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.username}!
          </h2>
          <p className="text-slate-400">
            Here's what's happening with your LiveBoard system today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Today's Schedules</p>
                <p className="text-2xl font-bold text-white">{stats.todaySchedules}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Active Announcements</p>
                <p className="text-2xl font-bold text-white">{stats.activeAnnouncements}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">Pending Tasks</p>
                <p className="text-2xl font-bold text-white">{stats.pendingTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-400">System Status</p>
                <p className="text-2xl font-bold text-green-400">Online</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                to="/admin"
                className="bg-brand-500 hover:bg-brand-600 text-slate-900 font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] text-center"
              >
                Manage Schedules
              </Link>
              <Link
                to="/admin"
                className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
              >
                Add Announcement
              </Link>
              <Link
                to="/display?kiosk=true"
                className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
              >
                Kiosk Mode
              </Link>
              <Link
                to="/admin"
                className="bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
              >
                Manage Tasks
              </Link>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.type === 'schedule' ? 'bg-blue-400' :
                    activity.type === 'announcement' ? 'bg-yellow-400' :
                    activity.type === 'task' ? 'bg-green-400' : 'bg-purple-400'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {activity.details}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {activity.time}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
