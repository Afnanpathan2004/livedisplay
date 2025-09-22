import React, { useState, useEffect } from 'react'

export default function NewsTicker() {
  const [news, setNews] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Mock news data - in a real implementation, this would fetch from an API
    const mockNews = [
      "Welcome to LiveBoard - Your digital schedule display system",
      "Check the admin panel to manage schedules and announcements",
      "System is running smoothly - All displays are connected",
      "Remember to update your schedules for optimal room utilization"
    ]
    
    setNews(mockNews)
  }, [])

  useEffect(() => {
    if (news.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length)
    }, 5000) // Change news every 5 seconds

    return () => clearInterval(interval)
  }, [news.length])

  if (news.length === 0) {
    return null
  }

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3">
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold text-blue-400 whitespace-nowrap">
          NEWS
        </div>
        <div className="flex-1 overflow-hidden">
          <div 
            className="text-sm text-slate-300 whitespace-nowrap animate-pulse transition-all duration-500"
            key={currentIndex}
          >
            {news[currentIndex]}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {currentIndex + 1}/{news.length}
        </div>
      </div>
    </div>
  )
}
