import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'

export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="text-right">
      <div className="text-5xl font-semibold tracking-tight">{format(now, 'HH:mm:ss')}</div>
      <div className="text-xl text-slate-400">{format(now, 'EEEE, dd MMM yyyy')}</div>
    </div>
  )
}
