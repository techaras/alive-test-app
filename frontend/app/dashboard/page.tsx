'use client'

import { Button } from '@/components/ui/button'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'

export default function Dashboard() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1">
                <div className="border-b bg-background">
                    <div className="flex items-center justify-between px-6 py-4">
                        <SidebarTrigger />
                        <Button
                            asChild
                            variant="outline"
                            size="sm">
                            <a href="http://localhost:8000/logout">
                                <span>Sign out</span>
                            </a>
                        </Button>
                    </div>
                </div>
            </main>
        </SidebarProvider>
    )
}