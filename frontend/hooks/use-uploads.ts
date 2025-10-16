import { useEffect, useState, useCallback } from 'react'

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

  const fetchUploads = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/api/uploads', {
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired - redirect to login
          window.location.href = 'http://localhost:8000/signin'
          return
        }
        throw new Error('Failed to fetch uploads')
      }

      const data = await response.json()
      setUploads(data.uploads)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch uploads'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUploads()
  }, [fetchUploads])

  return {
    uploads,
    isLoading,
    error,
    refetch: fetchUploads,
  }
}