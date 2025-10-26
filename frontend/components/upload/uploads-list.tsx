'use client'

import { FileIcon, Loader2 } from 'lucide-react'
import { Upload } from '@/hooks/use-uploads'
import { formatTimestamp } from '@/lib/format-utils'
import { GenerateUI } from '@/components/upload/generate-ui'
import { DeleteUpload } from '@/components/upload/delete-upload'

interface UploadsListProps {
  uploads: Upload[]
  isLoading: boolean
  error: string | null
  onDelete: () => void
}

export function UploadsList({ uploads, isLoading, error, onDelete }: UploadsListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Your Uploads</h3>
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!isLoading && uploads.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            No uploads yet. Upload your first CSV file!
          </p>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="max-h-96 overflow-y-auto space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.upload_id}
              className="flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
            >
              <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {upload.row_count.toLocaleString()} rows × {upload.column_count} columns
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(upload.uploaded_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <GenerateUI />
                <DeleteUpload uploadId={upload.upload_id} onDelete={onDelete} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}