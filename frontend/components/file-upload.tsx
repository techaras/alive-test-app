'use client'

import { Upload, FileIcon, Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import AnimatedProgressBar from '@/components/smoothui/ui/AnimatedProgressBar'
import { useFileUpload } from '@/hooks/use-file-upload'
import { useUploads } from '@/hooks/use-uploads'
import { useState } from 'react'

export function FileUpload() {
  const { uploads, isLoading, error: fetchError, refetch } = useUploads()

  const {
    currentUpload,
    uploadProgress,
    uploadQueue,
    completedUploads,
    failedUploads,
    isUploading,
    error: uploadError,
    handleFileChange,
    retryFailed,
  } = useFileUpload({
    onSuccess: refetch
  })

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

    if (isUploading) return

    const files = Array.from(e.dataTransfer.files)
    
    if (files.length === 0) return

    // Validate all files are CSV (same logic as handleFileChange)
    const invalidFiles = files.filter(
      file => !file.name.endsWith('.csv') && file.type !== 'text/csv'
    )

    if (invalidFiles.length > 0) {
      // This will be handled by the hook's internal error state
      // We need to trigger the same flow, so we'll create a synthetic event
      const input = document.getElementById('file-upload') as HTMLInputElement
      const dataTransfer = new DataTransfer()
      files.forEach(file => dataTransfer.items.add(file))
      input.files = dataTransfer.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
      return
    }

    // Create synthetic change event with the dropped files
    const input = document.getElementById('file-upload') as HTMLInputElement
    const dataTransfer = new DataTransfer()
    files.forEach(file => dataTransfer.items.add(file))
    input.files = dataTransfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

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

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(2) + ' KB'
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Upload Dropzone */}
      <label 
        htmlFor="file-upload" 
        className={`block rounded-lg border border-dashed p-6 cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-gray-300 dark:border-gray-700 hover:border-primary/50 hover:bg-muted/50'
        }`}
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
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </label>

      {/* Upload Error */}
      {uploadError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{uploadError}</p>
        </div>
      )}

      {/* Current Upload Progress */}
      {currentUpload && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3">
            <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{currentUpload.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(currentUpload.size)}
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

      {/* Queue Status */}
      {isUploading && (uploadQueue.length > 0 || completedUploads.length > 0 || failedUploads.length > 0) && (
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
                  onClick={retryFailed}
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