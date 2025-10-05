import React from 'react'

export default function LoadingSpinner({ size = 'default', text = 'Loading...' }) {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-brand-500 mx-auto mb-4 ${sizeClasses[size]}`}></div>
        <p className="text-slate-400 animate-pulse">{text}</p>
      </div>
    </div>
  )
}
