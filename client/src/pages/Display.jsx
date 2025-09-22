import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import Clock from '../components/Clock'
import ScheduleGrid from '../components/ScheduleGrid'
import AnnouncementBanner from '../components/AnnouncementBanner'
import LayoutManager from '../components/LayoutManager'
import { io } from 'socket.io-client'
import QRCode from 'qrcode.react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Display() {
  const [entries, setEntries] = useState([])
  const [announcement, setAnnouncement] = useState(null)
  const [connected, setConnected] = useState(false)
  const [offline, setOffline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), [])
  const scheduleKey = useMemo(() => `schedule:${todayStr}`, [todayStr])
  const announcementKey = 'announcement:active'

  const params = new URLSearchParams(location.search)
  const kiosk = params.get('kiosk') === 'true'

  async function loadSchedule() {
    try {
      setError('')
      const res = await axios.get(`${API}/api/schedule`, { params: { date: todayStr } })
      setEntries(res.data)
      localStorage.setItem(scheduleKey, JSON.stringify(res.data))
      setOffline(false)
    } catch (e) {
      console.error('Failed to load schedule:', e)
      const cached = localStorage.getItem(scheduleKey)
      if (cached) {
        setEntries(JSON.parse(cached))
        setError('Using cached schedule data - server unavailable')
      } else {
        setError('Unable to load schedule data')
      }
      setOffline(true)
    } finally {
      setLoading(false)
    }
  }

  async function loadAnnouncement() {
    try {
      const res = await axios.get(`${API}/api/announcements`)
      const active = res.data.find(a => a.active)
      const msg = active ? active.message : null
      setAnnouncement(msg)
      if (msg) localStorage.setItem(announcementKey, msg)
    } catch (e) {
      console.error('Failed to load announcements:', e)
      const cached = localStorage.getItem(announcementKey)
      if (cached) setAnnouncement(cached)
    }
  }

  useEffect(() => {
    loadSchedule()
    loadAnnouncement()

    const url = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:4000'
    const socket = io(url, { transports: ['websocket'], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 500, reconnectionDelayMax: 5000 })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('schedule:update', (payload) => {
      if (!payload || !payload.date || payload.date === todayStr) loadSchedule()
    })

    socket.on('announcement:update', () => loadAnnouncement())

    socket.on('system:midnight', () => {
      // Reload to switch to new date automatically
      location.reload()
    })

    return () => socket.close()
  }, [])

  if (kiosk) {
    return (
      <LayoutManager entries={entries} announcement={announcement} kiosk />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading display...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Enhanced Header with Navigation */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/25">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">LiveBoard</h1>
                <p className="text-sm text-slate-400">Live Display · {format(new Date(), 'MMMM dd, yyyy')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <Clock />
              
              {/* Quick Access Menu */}
              <div className="relative group">
                <button className="flex items-center px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all duration-300 border border-slate-700 hover:border-slate-600 shadow-lg">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Quick Access
                  <svg className="w-4 h-4 ml-2 group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="p-4">
                    <h3 className="text-white font-bold mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Management Features
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Link to="/login" className="group flex items-center p-3 bg-slate-700/50 hover:bg-blue-600 rounded-xl transition-all duration-300 border border-slate-600 hover:border-blue-500">
                        <svg className="w-4 h-4 mr-2 text-blue-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <div className="text-slate-200 group-hover:text-white text-sm font-medium">Schedule</div>
                          <div className="text-slate-400 group-hover:text-blue-100 text-xs">Edit display content</div>
                        </div>
                      </Link>
                      
                      <Link to="/login" className="group flex items-center p-3 bg-slate-700/50 hover:bg-green-600 rounded-xl transition-all duration-300 border border-slate-600 hover:border-green-500">
                        <svg className="w-4 h-4 mr-2 text-green-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                          <div className="text-slate-200 group-hover:text-white text-sm font-medium">Employees</div>
                          <div className="text-slate-400 group-hover:text-green-100 text-xs">Manage staff</div>
                        </div>
                      </Link>
                      
                      <Link to="/login" className="group flex items-center p-3 bg-slate-700/50 hover:bg-purple-600 rounded-xl transition-all duration-300 border border-slate-600 hover:border-purple-500">
                        <svg className="w-4 h-4 mr-2 text-purple-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                          <div className="text-slate-200 group-hover:text-white text-sm font-medium">Rooms</div>
                          <div className="text-slate-400 group-hover:text-purple-100 text-xs">Book & manage</div>
                        </div>
                      </Link>
                      
                      <Link to="/login" className="group flex items-center p-3 bg-slate-700/50 hover:bg-orange-600 rounded-xl transition-all duration-300 border border-slate-600 hover:border-orange-500">
                        <svg className="w-4 h-4 mr-2 text-orange-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div>
                          <div className="text-slate-200 group-hover:text-white text-sm font-medium">Visitors</div>
                          <div className="text-slate-400 group-hover:text-orange-100 text-xs">Track access</div>
                        </div>
                      </Link>
                      
                      <Link to="/login" className="group flex items-center p-3 bg-slate-700/50 hover:bg-red-600 rounded-xl transition-all duration-300 border border-slate-600 hover:border-red-500">
                        <svg className="w-4 h-4 mr-2 text-red-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <div>
                          <div className="text-slate-200 group-hover:text-white text-sm font-medium">Assets</div>
                          <div className="text-slate-400 group-hover:text-red-100 text-xs">Track inventory</div>
                        </div>
                      </Link>
                      
                      <Link to="/login" className="group flex items-center p-3 bg-slate-700/50 hover:bg-cyan-600 rounded-xl transition-all duration-300 border border-slate-600 hover:border-cyan-500">
                        <svg className="w-4 h-4 mr-2 text-cyan-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <div>
                          <div className="text-slate-200 group-hover:text-white text-sm font-medium">Reports</div>
                          <div className="text-slate-400 group-hover:text-cyan-100 text-xs">View analytics</div>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <Link to="/login" className="flex items-center justify-center w-full p-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all duration-300 font-medium">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Login to Access All Features
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="group flex items-center px-3 py-2 bg-slate-800/50 hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl transition-all duration-300 border border-slate-700 hover:border-blue-500 shadow-lg hover:shadow-blue-500/25"
                  title="Login to Dashboard"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Login
                </Link>
                
                <Link
                  to="/login"
                  className="group flex items-center px-3 py-2 bg-slate-800/50 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-xl transition-all duration-300 border border-slate-700 hover:border-cyan-500 shadow-lg hover:shadow-cyan-500/25"
                  title="Home Dashboard"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </Link>
                
                <Link
                  to="/login"
                  className="group flex items-center px-3 py-2 bg-slate-800/50 hover:bg-purple-600 text-slate-300 hover:text-white rounded-xl transition-all duration-300 border border-slate-700 hover:border-purple-500 shadow-lg hover:shadow-purple-500/25"
                  title="Admin Panel - Schedule Management"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin
                </Link>
                
                <Link
                  to="/login"
                  className="group flex items-center px-3 py-2 bg-slate-800/50 hover:bg-green-600 text-slate-300 hover:text-white rounded-xl transition-all duration-300 border border-slate-700 hover:border-green-500 shadow-lg hover:shadow-green-500/25"
                  title="HR Panel - Employee Management"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  HR Panel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-lg flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* Announcement Banner */}
        {announcement && (
          <div className="mb-8">
            <AnnouncementBanner message={announcement} />
          </div>
        )}

        {/* Schedule Grid */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Today's Schedule</h2>
            <div className="flex items-center space-x-2 text-sm">
              <div className={`flex items-center space-x-1 ${connected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span>{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
              {offline && (
                <div className="flex items-center space-x-1 text-amber-400">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span>Offline Mode</span>
                </div>
              )}
            </div>
          </div>
          
          <ScheduleGrid entries={entries} />
          
          {entries.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="h-12 w-12 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a4 4 0 11-8 0v-1a4 4 0 014-4h4a4 4 0 014 4v1a4 4 0 11-8 0z" />
              </svg>
              <h3 className="text-lg font-medium text-slate-400 mb-2">No Schedule Available</h3>
              <p className="text-slate-500">There are no scheduled events for today.</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/display?kiosk=true"
            className="bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-xl p-6 transition-all group"
          >
            <div className="flex items-center">
              <div className="h-10 w-10 bg-brand-500/20 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white group-hover:text-brand-400 transition-colors">Kiosk Mode</h3>
                <p className="text-sm text-slate-400">Full-screen display view</p>
              </div>
            </div>
          </Link>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-slate-700 rounded-lg flex items-center justify-center mr-4">
                <QRCode value={`${location.origin}/display`} size={40} bgColor="transparent" fgColor="#64748b" />
              </div>
              <div>
                <h3 className="font-medium text-white">Mobile Access</h3>
                <p className="text-sm text-slate-400">Scan QR code to view</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-white">System Status</h3>
                <p className="text-sm text-slate-400">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons for Quick Access */}
      <div className="fixed bottom-8 right-8 z-50">
        <div className="flex flex-col space-y-3">
          {/* Schedule Management Button */}
          <Link
            to="/login"
            className="group bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white p-4 rounded-full shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 transform hover:scale-110 active:scale-95"
            title="Schedule Management - Edit Display Content"
          >
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </Link>
          
          {/* Admin Panel Button */}
          <Link
            to="/login"
            className="group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-full shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-110 active:scale-95"
            title="Admin Panel - System Management"
          >
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
          
          {/* HR Dashboard Button */}
          <Link
            to="/login"
            className="group bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 rounded-full shadow-2xl shadow-green-500/25 hover:shadow-green-500/40 transition-all duration-300 transform hover:scale-110 active:scale-95"
            title="HR Dashboard - Employee Management"
          >
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </Link>
          
          {/* Home/Login Button */}
          <Link
            to="/login"
            className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white p-4 rounded-full shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-110 active:scale-95"
            title="Login to Access All Features"
          >
            <svg className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
