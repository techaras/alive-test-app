'use client'

import { Upload, X, FileIcon, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AnimatedProgressBar from '@/components/smoothui/ui/AnimatedProgressBar'
import { useFileUpload } from '@/hooks/use-file-upload'

export function FileUpload() {
  const {
    selectedFile,
    isUploading,
    uploadProgress,
    uploadSuccess,
    uploadedAt,
    error,
    handleFileChange,
    handleRemove,
  } = useFileUpload()

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
    <div className="w-full max-w-md space-y-4">
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

      {selectedFile && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border bg-muted/50 p-3">
            <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              
              {uploadedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Uploaded: {formatTimestamp(uploadedAt)}
                </p>
              )}
              
              {error && (
                <p className="text-xs text-destructive mt-1">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {uploadSuccess && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
              
              {!isUploading && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {isUploading && (
            <AnimatedProgressBar
              value={uploadProgress}
              label="Uploading..."
              color="#6366f1"
            />
          )}
        </div>
      )}
    </div>
  )
}