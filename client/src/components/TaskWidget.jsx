import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function TaskWidget({ room, compact = false }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [room])

  async function loadTasks() {
    try {
      const params = { status: 'pending' }
      if (room) params.room = room
      
      const res = await axios.get(`${API}/api/tasks`, { params })
      setTasks(res.data)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  async function completeTask(taskId) {
    try {
      await axios.patch(`${API}/api/tasks/${taskId}/complete`)
      setTasks(tasks.filter(t => t.id !== taskId))
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
        <div className="text-lg font-semibold mb-3">Tasks</div>
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
        <div className="text-lg font-semibold mb-3">Tasks</div>
        <div className="text-slate-400">No pending tasks</div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
      <div className="text-lg font-semibold mb-3">
        {room ? `Room ${room} Tasks` : 'Tasks'}
      </div>
      <div className="space-y-2">
        {tasks.slice(0, compact ? 3 : 10).map(task => (
          <div key={task.id} className="flex items-center justify-between bg-slate-800/50 border border-slate-600 rounded-lg p-3">
            <div className="flex-1">
              <div className="font-medium text-sm">{task.title}</div>
              {task.description && !compact && (
                <div className="text-xs text-slate-400 mt-1">{task.description}</div>
              )}
              {task.dueTime && (
                <div className="text-xs text-amber-400 mt-1">
                  Due: {format(new Date(task.dueTime), 'MMM dd, HH:mm')}
                </div>
              )}
            </div>
            <button
              onClick={() => completeTask(task.id)}
              className="ml-2 px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs hover:bg-green-500/30 transition-colors"
            >
              ✓
            </button>
          </div>
        ))}
        {tasks.length > (compact ? 3 : 10) && (
          <div className="text-xs text-slate-400 text-center">
            +{tasks.length - (compact ? 3 : 10)} more tasks
          </div>
        )}
      </div>
    </div>
  )
}
