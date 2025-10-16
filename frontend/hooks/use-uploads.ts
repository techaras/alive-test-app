import { useEffect, useState, useRef } from 'react'

export interface Upload {
  upload_id: string
  filename: string
  uploaded_at: string
  row_count: number
  column_count: number
  columns: string[]
}

export function useUploads() {
  const [uploads, setUploads] = useState<Upload[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const isConnecting = useRef(false)

  useEffect(() => {
    // Prevent double connection in React Strict Mode
    if (isConnecting.current) return
    isConnecting.current = true

    const connectSSE = () => {
      // Close existing connection if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      const eventSource = new EventSource(
        'http://localhost:8000/api/uploads/stream',
        { withCredentials: true }
      )
      eventSourceRef.current = eventSource

      eventSource.addEventListener('connected', () => {
        setError(null)
        setIsLoading(true)
      })

      // Initial data load via SSE
      eventSource.addEventListener('initial', (event) => {
        const data = JSON.parse(event.data)
        setUploads(data.uploads)
        setIsLoading(false)
      })

      // New upload events
      eventSource.addEventListener('upload', (event) => {
        const uploadData: Upload = JSON.parse(event.data)
        setUploads((prev) => [uploadData, ...prev])
      })

      eventSource.addEventListener('ping', () => {
        // Keepalive - connection is healthy
      })

      eventSource.onerror = () => {
        const readyState = eventSource.readyState
        
        // If connection closed (readyState 2), it might be a 401
        if (readyState === EventSource.CLOSED) {
          setError('Session expired')
          setIsLoading(false)
          eventSource.close()
          
          // Check if we're actually logged out
          fetch('http://localhost:8000/api/me', {
            credentials: 'include',
          })
            .then(res => res.json())
            .then(data => {
              if (!data.authenticated) {
                // Session expired - redirect to login
                window.location.href = 'http://localhost:8000/signin'
              } else {
                // Session valid but connection failed - retry
                setTimeout(() => {
                  isConnecting.current = false
                  connectSSE()
                }, 3000)
              }
            })
            .catch(() => {
              // Network error - retry
              setTimeout(() => {
                isConnecting.current = false
                connectSSE()
              }, 3000)
            })
        } else {
          // Transient error - retry
          setError('Connection lost')
          setIsLoading(false)
          eventSource.close()
          
          setTimeout(() => {
            isConnecting.current = false
            connectSSE()
          }, 3000)
        }
      }
    }

    connectSSE()

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      isConnecting.current = false
    }
  }, [])

  return {
    uploads,
    isLoading,
    error,
  }
}