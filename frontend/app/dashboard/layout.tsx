'use client'

import { useEffect, useState } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { AppSidebar } from '@/components/app-sidebar'
import { UserNav } from '@/components/user-nav'
import { HealthCheck } from '@/components/health-check'
import { Skeleton } from '@/components/ui/skeleton'

interface User {
    id: string
    email: string
    first_name: string
    last_name: string
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('http://localhost:8000/api/me', {
            credentials: 'include',
        })
            .then(res => res.json())
            .then(data => {
                if (data.authenticated) {
                    setUser(data.user)
                } else {
                    window.location.href = 'http://localhost:8000/signin'
                }
                setLoading(false)
            })
            .catch(() => {
                window.location.href = 'http://localhost:8000/signin'
            })
    }, [])

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <div className="border-b bg-background rounded-t-xl">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger />
                            <Separator orientation="vertical" className="h-6" />
                            <HealthCheck />
                        </div>
                        {loading ? (
                            <Skeleton className="size-9 rounded-full" />
                        ) : (
                            user && <UserNav user={user} />
                        )}
                    </div>
                </div>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}