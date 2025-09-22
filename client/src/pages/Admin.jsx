import React, { useEffect, useMemo, useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { format } from 'date-fns'
import { AuthContext } from '../contexts/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Admin() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('schedules')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [entries, setEntries] = useState([])
  const [form, setForm] = useState({
    start_time: '', end_time: '', room_number: '', subject: '', faculty_name: ''
  })
  const [announcement, setAnnouncement] = useState('')
  const [announcements, setAnnouncements] = useState([])
  const [tasks, setTasks] = useState([])
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', room: '', dueTime: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filters, setFilters] = useState({
    room: '',
    faculty: '',
    search: ''
  })
  const [filteredEntries, setFilteredEntries] = useState([])
  const [exportData, setExportData] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    format: 'json'
  })
  const [importFile, setImportFile] = useState(null)

  const axiosAuth = useMemo(() => axios.create({ 
    baseURL: API, 
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), [])

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      // Load schedules with filters
      const scheduleParams = { date, ...filters }
      Object.keys(scheduleParams).forEach(key => {
        if (!scheduleParams[key]) delete scheduleParams[key]
      })
      
      const scheduleRes = await axios.get(`${API}/api/schedule`, { params: scheduleParams })
      setEntries(scheduleRes.data)
      setFilteredEntries(scheduleRes.data)
      
      // Load announcements
      const annRes = await axios.get(`${API}/api/announcements`)
      setAnnouncements(annRes.data)
      const active = annRes.data.find(a => a.active)
      setAnnouncement(active ? active.message : '')
      
      // Load tasks
      const tasksRes = await axios.get(`${API}/api/tasks`)
      setTasks(tasksRes.data)
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Apply local filters to entries
  const applyFilters = () => {
    let filtered = entries
    
    if (filters.room) {
      filtered = filtered.filter(entry => 
        entry.room_number.toLowerCase().includes(filters.room.toLowerCase())
      )
    }
    
    if (filters.faculty) {
      filtered = filtered.filter(entry => 
        entry.faculty_name.toLowerCase().includes(filters.faculty.toLowerCase())
      )
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.subject.toLowerCase().includes(searchLower) ||
        entry.faculty_name.toLowerCase().includes(searchLower) ||
        entry.room_number.toLowerCase().includes(searchLower)
      )
    }
    
    setFilteredEntries(filtered)
  }

  useEffect(() => { loadData() }, [date])
  useEffect(() => { applyFilters() }, [filters, entries])

  async function submitEntry(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axiosAuth.post(`${API}/api/schedule`, { ...form, date })
      setForm({ start_time: '', end_time: '', room_number: '', subject: '', faculty_name: '' })
      setSuccess('Schedule entry added successfully!')
      loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add schedule entry')
    } finally {
      setLoading(false)
    }
  }

  async function deleteEntry(id) {
    if (!confirm('Are you sure you want to delete this entry?')) return
    try {
      await axiosAuth.delete(`${API}/api/schedule/${id}`)
      setSuccess('Schedule entry deleted successfully!')
      loadData()
    } catch (err) {
      setError('Failed to delete entry')
    }
  }

  async function saveAnnouncement() {
    setLoading(true)
    try {
      const active = announcements.find(a => a.active)
      if (active) {
        await axiosAuth.put(`${API}/api/announcements/${active.id}`, { message: announcement, active: true })
      } else {
        await axiosAuth.post(`${API}/api/announcements`, { message: announcement, active: true })
      }
      setSuccess('Announcement saved successfully!')
      loadData()
    } catch (err) {
      setError('Failed to save announcement')
    } finally {
      setLoading(false)
    }
  }

  async function submitTask(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await axiosAuth.post(`${API}/api/tasks`, {
        ...taskForm,
        dueTime: taskForm.dueTime ? new Date(taskForm.dueTime).toISOString() : null
      })
      setTaskForm({ title: '', description: '', room: '', dueTime: '' })
      setSuccess('Task created successfully!')
      loadData()
    } catch (err) {
      setError('Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleExport = async (type = 'schedule') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: exportData.startDate,
        endDate: exportData.endDate,
        format: exportData.format
      })
      
      const endpoint = type === 'all' ? '/api/export/all' : '/api/export/schedule'
      const response = await axiosAuth.get(`${endpoint}?${params}`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const extension = exportData.format === 'csv' ? 'csv' : 'json'
      const filename = type === 'all' 
        ? `livedisplay_export_${exportData.startDate}_to_${exportData.endDate}.${extension}`
        : `schedule_${exportData.startDate}_to_${exportData.endDate}.${extension}`
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      setSuccess(`${type === 'all' ? 'All data' : 'Schedule'} exported successfully!`)
    } catch (err) {
      setError('Export failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      setError('Please select a file to import')
      return
    }
    
    setLoading(true)
    try {
      const fileContent = await importFile.text()
      const data = JSON.parse(fileContent)
      
      if (!data.entries && !data.data?.schedules) {
        throw new Error('Invalid file format')
      }
      
      const entries = data.entries || data.data?.schedules || []
      
      const response = await axiosAuth.post('/api/export/schedule/import', {
        entries,
        overwrite: false
      })
      
      setSuccess(`Import completed: ${response.data.results.imported} imported, ${response.data.results.skipped} skipped`)
      if (response.data.results.errors.length > 0) {
        setError(`Some errors occurred: ${response.data.results.errors.slice(0, 3).join(', ')}`)
      }
      
      setImportFile(null)
      loadData()
    } catch (err) {
      setError('Import failed: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
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
        {/* Notifications */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'schedules', name: 'Schedules', icon: '📅' },
              { id: 'announcements', name: 'Announcements', icon: '📢' },
              { id: 'tasks', name: 'Tasks', icon: '✅' },
              { id: 'export', name: 'Export/Import', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-brand-500 text-brand-500'
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="space-y-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Schedule Management</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Search and Filter Controls */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  placeholder="Search schedules..."
                  value={filters.search}
                  onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  placeholder="Filter by room..."
                  value={filters.room}
                  onChange={e => setFilters(f => ({ ...f, room: e.target.value }))}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  placeholder="Filter by faculty..."
                  value={filters.faculty}
                  onChange={e => setFilters(f => ({ ...f, faculty: e.target.value }))}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <form onSubmit={submitEntry} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                <input
                  placeholder="Start Time (HH:mm)"
                  value={form.start_time}
                  onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <input
                  placeholder="End Time (HH:mm)"
                  value={form.end_time}
                  onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <input
                  placeholder="Room Number"
                  value={form.room_number}
                  onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <input
                  placeholder="Subject"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <input
                  placeholder="Faculty Name"
                  value={form.faculty_name}
                  onChange={e => setForm(f => ({ ...f, faculty_name: e.target.value }))}
                  className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-all"
                >
                  {loading ? 'Adding...' : 'Add Schedule'}
                </button>
              </form>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white">Schedule Entries for {date}</h3>
                  <div className="text-sm text-slate-400">
                    {filteredEntries.length} of {entries.length} entries
                    {(filters.search || filters.room || filters.faculty) && (
                      <button
                        onClick={() => setFilters({ room: '', faculty: '', search: '' })}
                        className="ml-2 text-brand-400 hover:text-brand-300"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
                {filteredEntries.length === 0 ? (
                  <p className="text-slate-400">
                    {entries.length === 0 ? 'No schedule entries for this date.' : 'No entries match the current filters.'}
                  </p>
                ) : (
                  filteredEntries.map(entry => (
                    <div key={entry.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-white">{entry.subject}</h4>
                          <p className="text-sm text-slate-400">
                            Room {entry.room_number} • {entry.start_time} - {entry.end_time} • {entry.faculty_name}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Announcement Management</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Announcement</label>
                <textarea
                  value={announcement}
                  onChange={e => setAnnouncement(e.target.value)}
                  placeholder="Enter announcement message..."
                  className="w-full h-32 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>
              <button
                onClick={saveAnnouncement}
                disabled={loading}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-all"
              >
                {loading ? 'Saving...' : 'Save Announcement'}
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-white mb-4">All Announcements</h3>
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-slate-400">No announcements yet.</p>
                ) : (
                  announcements.map(ann => (
                    <div key={ann.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-white">{ann.message}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {ann.active ? '🟢 Active' : '🔴 Inactive'} • {format(new Date(ann.timestamp), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Task Management</h2>
            
            <form onSubmit={submitTask} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                placeholder="Task Title"
                value={taskForm.title}
                onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
              <input
                placeholder="Room (optional)"
                value={taskForm.room}
                onChange={e => setTaskForm(f => ({ ...f, room: e.target.value }))}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={taskForm.description}
                onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                className="md:col-span-2 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-24"
              />
              <input
                type="datetime-local"
                value={taskForm.dueTime}
                onChange={e => setTaskForm(f => ({ ...f, dueTime: e.target.value }))}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-all"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="text-lg font-medium text-white">All Tasks</h3>
              {tasks.length === 0 ? (
                <p className="text-slate-400">No tasks yet.</p>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-slate-300 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                          <span className={`px-2 py-1 rounded ${
                            task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.room && <span>Room: {task.room}</span>}
                          {task.dueTime && (
                            <span>Due: {format(new Date(task.dueTime), 'MMM dd, HH:mm')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Export/Import Tab */}
        {activeTab === 'export' && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Export & Import Data</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Export Section */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Export Data</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={exportData.startDate}
                        onChange={e => setExportData(d => ({ ...d, startDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                      <input
                        type="date"
                        value={exportData.endDate}
                        onChange={e => setExportData(d => ({ ...d, endDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                    <select
                      value={exportData.format}
                      onChange={e => setExportData(d => ({ ...d, format: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleExport('schedule')}
                      disabled={loading}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-900 font-semibold py-3 px-4 rounded-lg transition-all"
                    >
                      {loading ? 'Exporting...' : 'Export Schedules'}
                    </button>
                    <button
                      onClick={() => handleExport('all')}
                      disabled={loading}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                    >
                      {loading ? 'Exporting...' : 'Export All Data'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Section */}
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Import Data</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Select File</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={e => setImportFile(e.target.files[0])}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500 file:text-slate-900 file:font-medium hover:file:bg-brand-600"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Upload a JSON file exported from this system
                    </p>
                  </div>
                  
                  {importFile && (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                      <p className="text-sm text-white">Selected: {importFile.name}</p>
                      <p className="text-xs text-slate-400">Size: {(importFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  )}
                  
                  <button
                    onClick={handleImport}
                    disabled={loading || !importFile}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                  >
                    {loading ? 'Importing...' : 'Import Data'}
                  </button>
                  
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-400 mb-2">Import Notes:</h4>
                    <ul className="text-xs text-blue-300 space-y-1">
                      <li>• Duplicate entries will be skipped</li>
                      <li>• Invalid entries will be reported</li>
                      <li>• Only JSON format is supported for import</li>
                      <li>• Backup your data before importing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
