import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export function useSocket(onEvents = {}) {
  const socketRef = useRef(null)

  useEffect(() => {
    const url = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:4000'
    const s = io(url, { transports: ['websocket'], forceNew: true })
    socketRef.current = s

    Object.entries(onEvents).forEach(([event, handler]) => {
      if (typeof handler === 'function') s.on(event, handler)
    })

    return () => {
      Object.entries(onEvents).forEach(([event, handler]) => {
        if (typeof handler === 'function') s.off(event, handler)
      })
      s.close()
    }
  }, [])

  return socketRef.current
}
