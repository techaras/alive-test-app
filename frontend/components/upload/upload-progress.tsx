'use client'

import { FileIcon } from 'lucide-react'
import AnimatedProgressBar from '@/components/smoothui/ui/AnimatedProgressBar'
import { formatFileSize } from '@/lib/format-utils'

interface UploadProgressProps {
  file: File
  progress: number
}

export function UploadProgress({ file, progress }: UploadProgressProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3">
        <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>

      <AnimatedProgressBar
        value={progress}
        label="Uploading..."
        color="#6366f1"
      />
    </div>
  )
}