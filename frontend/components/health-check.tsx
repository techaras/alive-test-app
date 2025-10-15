'use client'

import { useEffect, useState } from 'react'

interface HealthStatus {
    status: string
    service: string
}

export function HealthCheck() {
    const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Create SSE connection
        const eventSource = new EventSource('http://localhost:8000/health/stream')

        eventSource.onopen = () => {
            setError(null) // Clear error when connected
        }

        eventSource.addEventListener('health', (event) => {
            const data = JSON.parse(event.data)
            setHealthStatus(data)
            setError(null) // Clear error when receiving data
        })

        eventSource.onerror = () => {
            setError('Connection failed')
            setHealthStatus(null) // Clear status when connection fails
        }

        // Cleanup on unmount
        return () => {
            eventSource.close()
        }
    }, [])

    const status = error ? 'error' : healthStatus?.status === 'alive' ? 'alive' : 'loading'

    return (
        <div className="flex items-center gap-2">
            <div
                className={`size-2 rounded-full ${
                    status === 'alive'
                        ? 'bg-green-500'
                        : status === 'error'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                }`}
            />
            <span className="text-sm text-muted-foreground">
                {status === 'alive' ? 'API Online' : status === 'error' ? 'API Offline' : 'Checking...'}
            </span>
        </div>
    )
}