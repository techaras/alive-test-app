'use client'

import { Trash2 } from 'lucide-react'

export function DeleteUpload() {
  return (
    <button
      className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 cursor-pointer"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Delete
    </button>
  )
}