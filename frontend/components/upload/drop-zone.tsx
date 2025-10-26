'use client'

import { useState } from 'react'
import { Upload } from 'lucide-react'

interface DropZoneProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}

export function DropZone({ onFileChange, disabled = false }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    
    if (files.length === 0) return

    // Create synthetic change event with the dropped files
    const input = document.getElementById('file-upload') as HTMLInputElement
    const dataTransfer = new DataTransfer()
    files.forEach(file => dataTransfer.items.add(file))
    input.files = dataTransfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  return (
    <label 
      htmlFor="file-upload" 
      className={`block rounded-lg border border-dashed p-6 cursor-pointer transition-colors ${
        isDragging
          ? 'border-primary bg-primary/10'
          : 'border-gray-300 dark:border-gray-700 hover:border-primary/50 hover:bg-muted/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3">
          <Upload className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </div>

        <div className="text-center">
          <span className="text-sm font-medium text-primary">
            Choose files
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            CSV files only • Select multiple files
          </p>
        </div>
      </div>
      
      <input
        id="file-upload"
        type="file"
        accept=".csv,text/csv"
        multiple
        className="sr-only"
        onChange={onFileChange}
        disabled={disabled}
      />
    </label>
  )
}