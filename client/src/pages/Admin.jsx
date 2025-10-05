import { Link, useNavigate } from 'react-router-dom'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'

import { AuthContext } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { format } from 'date-fns'
import { API_BASE_URL } from '../config'

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
  const [rooms, setRooms] = useState([])
  const [roomForm, setRoomForm] = useState({
    name: '', capacity: '', location: '', amenities: ''
  })
  const [employees, setEmployees] = useState([])
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', department: '', position: ''
  })
  const [visitors, setVisitors] = useState([])
  const [visitorForm, setVisitorForm] = useState({
    name: '', company: '', email: '', phone: '', purpose: '', hostEmployee: ''
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

  // Dynamic dropdown options from settings
  const [dropdownSettings, setDropdownSettings] = useState({
    rooms: [],
    subjects: [],
    faculties: [],
    departments: [],
    positions: [],
    companies: [],
    purposes: [],
    locations: [],
    amenities: []
  })

  // Static options that don't need to be managed
  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ]
  
  const priorityOptions = ['low', 'medium', 'high', 'urgent']
  const statusOptions = ['pending', 'in-progress', 'completed', 'cancelled']
  
  // Use dynamic settings for dropdowns
  const roomOptions = dropdownSettings.rooms
  const subjectOptions = dropdownSettings.subjects
  const facultyOptions = dropdownSettings.faculties
  const departmentOptions = dropdownSettings.departments
  const positionOptions = dropdownSettings.positions
  const companyOptions = dropdownSettings.companies
  const purposeOptions = dropdownSettings.purposes
  const locationOptions = dropdownSettings.locations
  const amenitiesOptions = dropdownSettings.amenities

  const axiosAuth = useMemo(() => axios.create({ 
    baseURL: API_BASE_URL, 
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  }), [])

  // Load dropdown settings
  async function loadSettings() {
    try {
      const settingsRes = await apiService.settings.getAll()
      setDropdownSettings(settingsRes.data)
    } catch (err) {
      console.error('Failed to load settings:', err)
      // Use defaults if settings fail to load
      setDropdownSettings({
        rooms: ['Room 101', 'Room 102', 'Lab 1', 'Conference Hall'],
        subjects: ['Computer Science', 'Mathematics', 'Workshop'],
        faculties: ['Dr. Sarah Johnson', 'Prof. Michael Chen'],
        departments: ['Computer Science', 'IT', 'HR', 'Finance'],
        positions: ['Professor', 'Manager', 'Developer'],
        companies: ['ABC Corporation', 'XYZ Technologies', 'Other'],
        purposes: ['Business Meeting', 'Interview', 'Consultation'],
        locations: ['Floor 1', 'Floor 2', 'Floor 3'],
        amenities: ['Projector', 'Whiteboard', 'WiFi']
      })
    }
  }

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      // Load settings first
      await loadSettings()

      // Load schedules with filters
      const scheduleParams = { date, ...filters }
      Object.keys(scheduleParams).forEach(key => {
        if (!scheduleParams[key]) delete scheduleParams[key]
      })

      const scheduleRes = await apiService.schedule.getAll(scheduleParams)
      setEntries(scheduleRes.data)
      setFilteredEntries(scheduleRes.data)

      // Load announcements
      const annRes = await apiService.announcements.getAll()
      setAnnouncements(annRes.data)
      const active = annRes.data.find(a => a.active)
      setAnnouncement(active ? active.message : '')

      // Load tasks
      const tasksRes = await apiService.tasks.getAll()
      setTasks(tasksRes.data)

      // Load rooms (mock data for now)
      setRooms([
        { id: '1', name: 'Conference Room A', capacity: 20, location: 'Floor 1', amenities: 'Projector, Whiteboard', status: 'available' },
        { id: '2', name: 'Meeting Room B', capacity: 10, location: 'Floor 2', amenities: 'TV Screen', status: 'available' },
        { id: '3', name: 'Board Room', capacity: 15, location: 'Floor 3', amenities: 'Video Conference', status: 'occupied' }
      ])

      // Load employees (mock data for now)
      setEmployees([
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@company.com', phone: '555-0101', department: 'IT', position: 'Developer' },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@company.com', phone: '555-0102', department: 'HR', position: 'Manager' }
      ])

      // Load visitors (mock data for now)
      setVisitors([
        { id: '1', name: 'Mike Johnson', company: 'ABC Corp', email: 'mike@abc.com', phone: '555-0201', purpose: 'Business Meeting', hostEmployee: 'John Doe', checkIn: new Date().toISOString(), status: 'checked-in' }
      ])
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
        entry.room_number?.toLowerCase().includes(filters.room.toLowerCase())
      )
    }
    
    if (filters.faculty) {
      filtered = filtered.filter(entry => 
        entry.faculty_name?.toLowerCase().includes(filters.faculty.toLowerCase())
      )
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(entry => 
        entry.subject?.toLowerCase().includes(searchLower) ||
        entry.faculty_name?.toLowerCase().includes(searchLower) ||
        entry.room_number?.toLowerCase().includes(searchLower)
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
      await axiosAuth.post(`${API_BASE_URL}/api/schedule`, { ...form, date })
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
      await axiosAuth.delete(`${API_BASE_URL}/api/schedule/${id}`)
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
        await axiosAuth.put(`${API_BASE_URL}/api/announcements/${active.id}`, { message: announcement, active: true })
      } else {
        await axiosAuth.post(`${API_BASE_URL}/api/announcements`, { message: announcement, active: true })
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
      await axiosAuth.post(`${API_BASE_URL}/api/tasks`, {
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

  async function submitRoom(e) {
    e.preventDefault()
    const newRoom = {
      id: Date.now().toString(),
      ...roomForm,
      status: 'available',
      capacity: parseInt(roomForm.capacity)
    }
    setRooms([...rooms, newRoom])
    setRoomForm({ name: '', capacity: '', location: '', amenities: '' })
    setSuccess('Room added successfully!')
  }

  async function submitEmployee(e) {
    e.preventDefault()
    const newEmployee = {
      id: Date.now().toString(),
      ...employeeForm
    }
    setEmployees([...employees, newEmployee])
    setEmployeeForm({ firstName: '', lastName: '', email: '', phone: '', department: '', position: '' })
    setSuccess('Employee added successfully!')
  }

  async function submitVisitor(e) {
    e.preventDefault()
    const newVisitor = {
      id: Date.now().toString(),
      ...visitorForm,
      checkIn: new Date().toISOString(),
      status: 'checked-in'
    }
    setVisitors([...visitors, newVisitor])
    setVisitorForm({ name: '', company: '', email: '', phone: '', purpose: '', hostEmployee: '' })
    setSuccess('Visitor checked in successfully!')
  }

  const deleteRoom = (id) => {
    setRooms(rooms.filter(r => r.id !== id))
    setSuccess('Room deleted successfully!')
  }

  const deleteEmployee = (id) => {
    setEmployees(employees.filter(e => e.id !== id))
    setSuccess('Employee deleted successfully!')
  }

  const checkOutVisitor = (id) => {
    setVisitors(visitors.map(v => v.id === id ? { ...v, status: 'checked-out', checkOut: new Date().toISOString() } : v))
    setSuccess('Visitor checked out successfully!')
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
                to="/users"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                User Management
              </Link>
              <Link
                to="/settings"
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Settings
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
          <nav className="flex space-x-4 overflow-x-auto">
            {[
              { id: 'schedules', name: 'Schedules', icon: '📅' },
              { id: 'announcements', name: 'Announcements', icon: '📢' },
              { id: 'tasks', name: 'Tasks', icon: '✅' },
              { id: 'rooms', name: 'Room Booking', icon: '🏢' },
              { id: 'employees', name: 'Employees', icon: '👥' },
              { id: 'visitors', name: 'Visitors', icon: '🚶' },
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
                <div>
                  <select
                    value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  >
                    <option value="">Start Time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={form.end_time}
                    onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  >
                    <option value="">End Time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={form.room_number}
                    onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  >
                    <option value="">Select Room</option>
                    {roomOptions.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjectOptions.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={form.faculty_name}
                    onChange={e => setForm(f => ({ ...f, faculty_name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  >
                    <option value="">Select Faculty</option>
                    {facultyOptions.map(faculty => (
                      <option key={faculty} value={faculty}>{faculty}</option>
                    ))}
                  </select>
                </div>
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
                          <p className="text-white">{ann.title || ann.message}</p>
                          {ann.content && <p className="text-sm text-slate-400 mt-1">{ann.content}</p>}
                          <p className="text-xs text-slate-400 mt-1">
                            {ann.isActive || ann.active ? '🟢 Active' : '🔴 Inactive'} • 
                            {ann.createdAt ? format(new Date(ann.createdAt), 'MMM dd, yyyy HH:mm') : 
                             ann.timestamp ? format(new Date(ann.timestamp), 'MMM dd, yyyy HH:mm') : 
                             'No date'}
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
              <select
                value={taskForm.room}
                onChange={e => setTaskForm(f => ({ ...f, room: e.target.value }))}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Room (optional)</option>
                {roomOptions.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
              <select
                value={taskForm.priority || 'medium'}
                onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Priority</option>
                {priorityOptions.map(priority => (
                  <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>
                ))}
              </select>
              <select
                value={taskForm.status || 'pending'}
                onChange={e => setTaskForm(f => ({ ...f, status: e.target.value }))}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</option>
                ))}
              </select>
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
                            <span>Due: {
                              task.dueTime && !isNaN(new Date(task.dueTime).getTime()) 
                                ? format(new Date(task.dueTime), 'MMM dd, HH:mm')
                                : 'Invalid date'
                            }</span>
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

        {/* Room Booking Tab */}
        {activeTab === 'rooms' && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Room Management</h2>
            
            <form onSubmit={submitRoom} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <select
                value={roomForm.name}
                onChange={e => setRoomForm({...roomForm, name: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Room</option>
                {roomOptions.map(room => (
                  <option key={room} value={room}>{room}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Capacity"
                value={roomForm.capacity}
                onChange={e => setRoomForm({...roomForm, capacity: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={roomForm.location}
                onChange={e => setRoomForm({...roomForm, location: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Location</option>
                {locationOptions.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <input
                placeholder="Amenities (comma separated)"
                value={roomForm.amenities}
                onChange={e => setRoomForm({...roomForm, amenities: e.target.value})}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="md:col-span-2 bg-brand-500 hover:bg-brand-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Add Room
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-white mb-4">All Rooms ({rooms.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <div key={room.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium">{room.name}</h4>
                      <span className={`px-2 py-1 rounded text-xs ${
                        room.status === 'available' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {room.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 space-y-1">
                      <p>👥 Capacity: {room.capacity}</p>
                      <p>📍 {room.location}</p>
                      {room.amenities && <p>🔧 {room.amenities}</p>}
                    </div>
                    <button
                      onClick={() => deleteRoom(room.id)}
                      className="mt-3 w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 py-2 rounded transition-colors text-sm"
                    >
                      Delete Room
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === 'employees' && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Employee Management</h2>
            
            <form onSubmit={submitEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                placeholder="First Name"
                value={employeeForm.firstName}
                onChange={e => setEmployeeForm({...employeeForm, firstName: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                placeholder="Last Name"
                value={employeeForm.lastName}
                onChange={e => setEmployeeForm({...employeeForm, lastName: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={employeeForm.email}
                onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={employeeForm.phone}
                onChange={e => setEmployeeForm({...employeeForm, phone: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={employeeForm.department}
                onChange={e => setEmployeeForm({...employeeForm, department: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Department</option>
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={employeeForm.position}
                onChange={e => setEmployeeForm({...employeeForm, position: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Position</option>
                {positionOptions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              <button
                type="submit"
                className="md:col-span-2 bg-brand-500 hover:bg-brand-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Add Employee
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-white mb-4">All Employees ({employees.length})</h3>
              <div className="space-y-3">
                {employees.map(emp => (
                  <div key={emp.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{emp.firstName} {emp.lastName}</h4>
                        <div className="text-sm text-slate-400 mt-1 space-y-1">
                          <p>📧 {emp.email}</p>
                          <p>📞 {emp.phone}</p>
                          <p>🏢 {emp.department} - {emp.position}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEmployee(emp.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Visitors Tab */}
        {activeTab === 'visitors' && (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Visitor Management</h2>
            
            <form onSubmit={submitVisitor} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                placeholder="Visitor Name"
                value={visitorForm.name}
                onChange={e => setVisitorForm({...visitorForm, name: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={visitorForm.company}
                onChange={e => setVisitorForm({...visitorForm, company: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Company</option>
                {companyOptions.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
              <input
                type="email"
                placeholder="Email"
                value={visitorForm.email}
                onChange={e => setVisitorForm({...visitorForm, email: e.target.value})}
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={visitorForm.phone}
                onChange={e => setVisitorForm({...visitorForm, phone: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={visitorForm.purpose}
                onChange={e => setVisitorForm({...visitorForm, purpose: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Purpose</option>
                {purposeOptions.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
              <select
                value={visitorForm.hostEmployee}
                onChange={e => setVisitorForm({...visitorForm, hostEmployee: e.target.value})}
                required
                className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select Host Employee</option>
                {facultyOptions.map(faculty => (
                  <option key={faculty} value={faculty}>{faculty}</option>
                ))}
              </select>
              <button
                type="submit"
                className="md:col-span-2 bg-brand-500 hover:bg-brand-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Check-In Visitor
              </button>
            </form>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-white mb-4">All Visitors ({visitors.length})</h3>
              <div className="space-y-3">
                {visitors.map(visitor => (
                  <div key={visitor.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium">{visitor.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            visitor.status === 'checked-in' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {visitor.status}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <p>🏢 {visitor.company}</p>
                          <p>📧 {visitor.email}</p>
                          <p>📞 {visitor.phone}</p>
                          <p>📝 Purpose: {visitor.purpose}</p>
                          <p>👤 Host: {visitor.hostEmployee}</p>
                          <p>🕐 Check-in: {format(new Date(visitor.checkIn), 'MMM dd, HH:mm')}</p>
                          {visitor.checkOut && <p>🕐 Check-out: {format(new Date(visitor.checkOut), 'MMM dd, HH:mm')}</p>}
                        </div>
                      </div>
                      {visitor.status === 'checked-in' && (
                        <button
                          onClick={() => checkOutVisitor(visitor.id)}
                          className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-3 py-1 rounded text-sm transition-colors"
                        >
                          Check Out
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
