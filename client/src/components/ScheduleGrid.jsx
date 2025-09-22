import React from 'react'
import clsx from 'classnames'

function parseHM(hm) {
  const [h, m] = hm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

export default function ScheduleGrid({ entries }) {
  const byRoom = entries.reduce((acc, e) => {
    acc[e.room_number] = acc[e.room_number] || []
    acc[e.room_number].push(e)
    return acc
  }, {})

  const rooms = Object.keys(byRoom).sort()

  const now = new Date()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map(room => (
        <div key={room} className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
          <div className="text-xl font-semibold mb-3">Room {room}</div>
          <div className="space-y-2">
            {byRoom[room].map(item => {
              const start = parseHM(item.start_time)
              const end = parseHM(item.end_time)
              const isCurrent = now >= start && now < end
              const isPast = now >= end
              const isUpcoming = now < start

              return (
                <div key={item.id} className={clsx('p-3 rounded-lg border', {
                  'bg-green-500/10 border-green-500/30': isCurrent,
                  'bg-slate-800 border-slate-700 text-slate-400': isPast,
                  'bg-yellow-500/10 border-yellow-500/30': isUpcoming,
                })}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{item.subject}</div>
                    <div className="text-sm tabular-nums">{item.start_time} – {item.end_time}</div>
                  </div>
                  <div className="text-sm text-slate-400">{item.faculty_name}</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
