import React from 'react'
import clsx from 'classnames'

function parseHM(timeStr) {
  // Return current time if no valid time string provided
  if (!timeStr || typeof timeStr !== 'string') {
    return new Date();
  }
  
  // Handle ISO date strings (e.g., "2025-10-04T10:30:00.000Z")
  if (timeStr.includes('T') || timeStr.includes('-')) {
    return new Date(timeStr);
  }
  
  // Handle time strings (e.g., "10:30")
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const [h, m] = parts.map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }
  
  // Fallback to current time if format is invalid
  return new Date();
}

export default function ScheduleGrid({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center text-slate-400 py-8">
        No schedules available for today
      </div>
    );
  }

  // Group by type (meeting, class, event, etc.) since we don't have room_number
  const byType = entries.reduce((acc, e) => {
    const type = e.type || 'general';
    acc[type] = acc[type] || [];
    acc[type].push(e);
    return acc;
  }, {});

  const types = Object.keys(byType).sort();
  const now = new Date();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {types.map(type => (
        <div key={type} className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
          <div className="text-xl font-semibold mb-3 capitalize">{type}</div>
          <div className="space-y-2">
            {byType[type].map(item => {
              // Support both camelCase and snake_case field names
              const startTime = item.startTime || item.start_time || '';
              const endTime = item.endTime || item.end_time || '';
              const start = parseHM(startTime);
              const end = parseHM(endTime);
              const isCurrent = now >= start && now < end;
              const isPast = now >= end;
              const isUpcoming = now < start;

              return (
                <div key={item.id} className={clsx('p-3 rounded-lg border', {
                  'bg-green-500/10 border-green-500/30': isCurrent,
                  'bg-slate-800 border-slate-700 text-slate-400': isPast,
                  'bg-yellow-500/10 border-yellow-500/30': isUpcoming,
                })}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{item.title || item.subject || 'Untitled'}</div>
                    <div className={clsx('text-xs px-2 py-1 rounded', {
                      'bg-green-500/20 text-green-400': isCurrent,
                      'bg-slate-700 text-slate-400': isPast,
                      'bg-yellow-500/20 text-yellow-400': isUpcoming,
                    })}>
                      {isCurrent ? 'Now' : isPast ? 'Past' : 'Upcoming'}
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    {start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} – 
                    {end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {(item.content || item.faculty_name) && (
                    <div className="text-sm text-slate-500 mt-1">
                      {item.content || item.faculty_name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
