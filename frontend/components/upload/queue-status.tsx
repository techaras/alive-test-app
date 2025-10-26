'use client'

import { Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { FailedUpload } from '@/hooks/use-upload-queue'

interface QueueStatusProps {
  uploadQueue: File[]
  completedUploads: string[]
  failedUploads: FailedUpload[]
  onRetryFailed: () => void
}

export function QueueStatus({
  uploadQueue,
  completedUploads,
  failedUploads,
  onRetryFailed,
}: QueueStatusProps) {
  const hasContent = uploadQueue.length > 0 || completedUploads.length > 0 || failedUploads.length > 0

  if (!hasContent) return null

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      {/* Pending files */}
      {uploadQueue.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Pending ({uploadQueue.length})
          </p>
          <div className="space-y-2">
            {uploadQueue.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                <span className="truncate text-muted-foreground">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed files */}
      {completedUploads.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Completed ({completedUploads.length})
          </p>
          <div className="space-y-2">
            {completedUploads.map((filename, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="truncate">{filename}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed files */}
      {failedUploads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-destructive">
              Failed ({failedUploads.length})
            </p>
            <button
              onClick={onRetryFailed}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Retry all
            </button>
          </div>
          <div className="space-y-2">
            {failedUploads.map((failed, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="truncate">{failed.file.name}</span>
                </div>
                <p className="text-xs text-destructive/80 ml-6">{failed.error}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}