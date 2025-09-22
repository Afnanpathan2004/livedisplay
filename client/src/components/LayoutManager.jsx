import React, { useState, useEffect } from 'react'
import Clock from './Clock'
import ScheduleGrid from './ScheduleGrid'
import AnnouncementBanner from './AnnouncementBanner'
import TaskWidget from './TaskWidget'
import WeatherWidget from './WeatherWidget'
import NewsTicker from './NewsTicker'

const defaultLayout = {
  zones: [
    {
      id: 'header',
      type: 'header',
      position: { x: 0, y: 0, w: 12, h: 2 },
      config: { showTitle: true, showClock: true }
    },
    {
      id: 'announcements',
      type: 'announcements',
      position: { x: 0, y: 2, w: 12, h: 1 },
      config: {}
    },
    {
      id: 'main',
      type: 'schedule',
      position: { x: 0, y: 3, w: 8, h: 8 },
      config: {}
    },
    {
      id: 'sidebar',
      type: 'tasks',
      position: { x: 8, y: 3, w: 4, h: 4 },
      config: { compact: true }
    },
    {
      id: 'weather',
      type: 'weather',
      position: { x: 8, y: 7, w: 4, h: 2 },
      config: {}
    },
    {
      id: 'ticker',
      type: 'ticker',
      position: { x: 0, y: 11, w: 12, h: 1 },
      config: {}
    }
  ]
}

export default function LayoutManager({ children, entries, announcement, kiosk = false }) {
  const [layout, setLayout] = useState(defaultLayout)
  const [deviceId] = useState(() => {
    // Generate or retrieve device ID
    let id = localStorage.getItem('deviceId')
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('deviceId', id)
    }
    return id
  })

  useEffect(() => {
    // Load device-specific layout from server
    loadDeviceLayout()
  }, [deviceId])

  async function loadDeviceLayout() {
    try {
      // This would load from the server in a real implementation
      // For now, we'll use the default layout
      const savedLayout = localStorage.getItem(`layout_${deviceId}`)
      if (savedLayout) {
        setLayout(JSON.parse(savedLayout))
      }
    } catch (error) {
      console.error('Failed to load device layout:', error)
    }
  }

  function renderZone(zone) {
    const { type, config } = zone

    switch (type) {
      case 'header':
        return (
          <div className="flex items-center justify-between">
            {config.showTitle && (
              <div>
                <div className="text-2xl font-semibold">LiveBoard</div>
                <div className="text-slate-400">Daily Schedule</div>
              </div>
            )}
            {config.showClock && <Clock />}
          </div>
        )

      case 'announcements':
        return announcement ? <AnnouncementBanner message={announcement} /> : null

      case 'schedule':
        return <ScheduleGrid entries={entries} />

      case 'tasks':
        return <TaskWidget room={config.room} compact={config.compact} />

      case 'weather':
        return <WeatherWidget />

      case 'ticker':
        return <NewsTicker />

      case 'clock':
        return <Clock />

      default:
        return <div className="text-slate-400">Unknown zone type: {type}</div>
    }
  }

  if (kiosk) {
    // Kiosk mode: full screen layout
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-950 text-white">
        <div className="h-full w-full grid grid-cols-12 grid-rows-12 gap-2 p-4">
          {layout.zones.map(zone => (
            <div
              key={zone.id}
              className="col-span-12 row-span-12"
              style={{
                gridColumn: `span ${zone.position.w}`,
                gridRow: `span ${zone.position.h}`,
                gridColumnStart: zone.position.x + 1,
                gridRowStart: zone.position.y + 1
              }}
            >
              {renderZone(zone)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Normal mode: responsive layout
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        {layout.zones.find(z => z.type === 'header') && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-semibold">LiveBoard</div>
              <div className="text-slate-400">Daily Schedule</div>
            </div>
            <Clock />
          </div>
        )}

        {/* Announcements */}
        {announcement && (
          <div>
            <AnnouncementBanner message={announcement} />
          </div>
        )}

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Schedule */}
          <div className="lg:col-span-2">
            <ScheduleGrid entries={entries} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TaskWidget />
            <WeatherWidget />
          </div>
        </div>

        {/* Ticker */}
        <div className="mt-6">
          <NewsTicker />
        </div>
      </div>
    </div>
  )
}
