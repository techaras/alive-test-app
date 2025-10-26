'use client'

import { Sparkles } from 'lucide-react'

export function GenerateUI() {
  return (
    <button
      className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Generate UI
    </button>
  )
}