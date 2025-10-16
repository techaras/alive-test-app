import { useEffect, useState } from 'react'

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

  useEffect(() => {
    // Fetch initial uploads
    const fetchInitialUploads = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/uploads', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch uploads')
        }

        const data = await response.json()
        
        if (data.success) {
          setUploads(data.uploads)
        }
        
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch uploads')
        setIsLoading(false)
      }
    }

    fetchInitialUploads()

    // Connect to SSE for real-time updates
    const eventSource = new EventSource('http://localhost:8000/api/uploads/stream', {
      withCredentials: true,
    })

    eventSource.addEventListener('connected', () => {
      setError(null)
    })

    eventSource.addEventListener('upload', (event) => {
      const uploadData: Upload = JSON.parse(event.data)
      
      // Add new upload to the beginning of the list
      setUploads((prevUploads) => [uploadData, ...prevUploads])
    })

    eventSource.addEventListener('ping', () => {
      // Keepalive - do nothing
    })

    eventSource.onerror = () => {
      setError('Connection to server lost')
    }

    // Cleanup on unmount
    return () => {
      eventSource.close()
    }
  }, [])

  return {
    uploads,
    isLoading,
    error,
  }
}