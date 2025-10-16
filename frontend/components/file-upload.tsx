'use client'

import { Upload, FileIcon, Loader2 } from 'lucide-react'
import AnimatedProgressBar from '@/components/smoothui/ui/AnimatedProgressBar'
import { useFileUpload } from '@/hooks/use-file-upload'
import { useUploads } from '@/hooks/use-uploads'

export function FileUpload() {
  const { uploads, isLoading, error: fetchError, refetch } = useUploads()

  const {
    selectedFile,
    isUploading,
    uploadProgress,
    error: uploadError,
    handleFileChange,
  } = useFileUpload({
    onSuccess: refetch
  })

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Upload Dropzone */}
      <label 
        htmlFor="file-upload" 
        className="block rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3">
            <Upload className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          </div>

          <div className="text-center">
            <span className="text-sm font-medium text-primary">
              Choose a file
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              CSV files only
            </p>
          </div>
        </div>
        
        <input
          id="file-upload"
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>

      {/* Current Upload Progress */}
      {selectedFile && isUploading && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3">
            <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>

          <AnimatedProgressBar
            value={uploadProgress}
            label="Uploading..."
            color="#6366f1"
          />
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{uploadError}</p>
        </div>
      )}

      {/* Uploads List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Your Uploads</h3>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {fetchError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{fetchError}</p>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}