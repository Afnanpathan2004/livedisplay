import React, { useState, useEffect } from 'react'

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, this would fetch from a weather API
    // For now, we'll simulate with mock data
    const mockWeather = {
      location: 'New York',
      temperature: 22,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12
    }
    
    setTimeout(() => {
      setWeather(mockWeather)
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
        <div className="text-lg font-semibold mb-3">Weather</div>
        <div className="text-slate-400">Loading...</div>
      </div>
    )
  }

  if (!weather) {
    return (
      <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
        <div className="text-lg font-semibold mb-3">Weather</div>
        <div className="text-slate-400">Weather data unavailable</div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
      <div className="text-lg font-semibold mb-3">Weather</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{weather.temperature}°C</span>
          <span className="text-sm text-slate-400">{weather.condition}</span>
        </div>
        <div className="text-sm text-slate-400">{weather.location}</div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Humidity: {weather.humidity}%</span>
          <span>Wind: {weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  )
}
