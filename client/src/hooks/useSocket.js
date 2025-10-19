import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

export function useSocket(onEvents = {}) {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const onEventsRef = useRef(onEvents)

  // Update ref when events change without triggering reconnection
  useEffect(() => {
    onEventsRef.current = onEvents
  }, [onEvents])

  useEffect(() => {
    // Only create socket once
    if (socketRef.current) return

    const fallback = typeof window !== 'undefined' ? window.location.origin.replace(/^http/, 'ws') : ''
    const url = import.meta.env.VITE_WEBSOCKET_URL || fallback
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
    })

    socket.on('connect', () => {
      console.log('🔗 Socket connected')
      setIsConnected(true)
      setConnectionError(null)
    })

    socket.on('connect_error', (error) => {
      console.error('❌ Socket error:', error.message)
      setIsConnected(false)
      setConnectionError(error.message)
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason)
      setIsConnected(false)
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`)
      setIsConnected(true)
      setConnectionError(null)
    })

    // Add event listeners
    Object.entries(onEventsRef.current).forEach(([event, handler]) => {
      if (typeof handler === 'function') {
        socket.on(event, handler)
      }
    })

    socketRef.current = socket

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, []) // Empty dependency array - only run once

  const authenticate = useCallback((token) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('authenticate', token)
    }
  }, [isConnected])

  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn('⚠️ Socket not connected, cannot emit event:', event)
    }
  }, [isConnected])

  const requestData = useCallback((dataType) => {
    emit('request_data', dataType)
  }, [emit])

  return {
    socket: socketRef.current,
    isConnected,
    connectionError,
    authenticate,
    emit,
    requestData
  }
}
