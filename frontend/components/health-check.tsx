'use client'

import { useEffect, useState } from 'react'

export function HealthCheck() {
    const [status, setStatus] = useState<'alive' | 'error' | 'loading'>('loading')

    useEffect(() => {
        fetch('http://localhost:8000/health')
            .then(res => res.json())
            .then(data => {
                if (data.status === 'alive') {
                    setStatus('alive')
                } else {
                    setStatus('error')
                }
            })
            .catch(() => {
                setStatus('error')
            })
    }, [])

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