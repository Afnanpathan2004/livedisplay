import React from 'react'

export default function AnnouncementBanner({ message }) {
  if (!message) return null
  return (
    <div className="w-full py-3 px-4 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded">
      <div className="text-center text-lg font-medium">{message}</div>
    </div>
  )
}
