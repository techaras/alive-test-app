'use client'

import { useFileUpload } from '@/hooks/use-file-upload'
import { useUploads } from '@/hooks/use-uploads'
import { DropZone } from '@/components/upload/drop-zone'
import { UploadProgress } from '@/components/upload/upload-progress'
import { QueueStatus } from '@/components/upload/queue-status'
import { UploadsList } from '@/components/upload/uploads-list'

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

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Upload Dropzone */}
      <DropZone 
        onFileChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Upload Error */}
      {uploadError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{uploadError}</p>
        </div>
      )}

      {/* Current Upload Progress */}
      {currentUpload && (
        <UploadProgress 
          file={currentUpload}
          progress={uploadProgress}
        />
      )}

      {/* Queue Status */}
      {isUploading && (
        <QueueStatus
          uploadQueue={uploadQueue}
          completedUploads={completedUploads}
          failedUploads={failedUploads}
          onRetryFailed={retryFailed}
        />
      )}

      {/* Uploads List */}
      <UploadsList
        uploads={uploads}
        isLoading={isLoading}
        error={fetchError}
        onDelete={refetch}
      />
    </div>
  )
}