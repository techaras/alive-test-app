'use client'

import { FileUpload } from '@/components/file-upload'

export default function DashboardPage() {
  return (
    <div className="flex gap-6 p-6">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to your dashboard.</p>
      </div>
      
      <div className="w-full max-w-md">
        <FileUpload />
      </div>
    </div>
  )
}