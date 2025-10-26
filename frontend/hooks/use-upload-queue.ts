import { useState } from 'react'
import { uploadFile } from '@/lib/upload-service'

export interface FailedUpload {
  file: File
  error: string
}

interface UseUploadQueueProps {
  onSuccess?: () => void
}

export function useUploadQueue({ onSuccess }: UseUploadQueueProps = {}) {
  const [uploadQueue, setUploadQueue] = useState<File[]>([])
  const [completedUploads, setCompletedUploads] = useState<string[]>([])
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const processQueue = async (
    filesToUpload: File[],
    onFileStart: (file: File) => void,
    onFileProgress: (percentage: number) => void,
    onFileComplete: (file: File) => void,
    onFileError: (file: File, error: string) => void
  ) => {
    setIsProcessing(true)
    setCompletedUploads([])
    setFailedUploads([])
    setUploadQueue(filesToUpload)

    for (const file of filesToUpload) {
      onFileStart(file)
      
      // Remove from queue as we start uploading
      setUploadQueue(prev => prev.filter(f => f !== file))

      try {
        await uploadFile(file, (progress) => {
          onFileProgress(progress.percentage)
        })
        
        // Mark as completed
        setCompletedUploads(prev => [...prev, file.name])
        onFileComplete(file)
        
        // Refetch after each successful upload
        if (onSuccess) {
          onSuccess()
        }
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setFailedUploads(prev => [...prev, { file, error: errorMessage }])
        onFileError(file, errorMessage)
      }
    }

    setIsProcessing(false)
  }

  const clearQueue = () => {
    setUploadQueue([])
    setCompletedUploads([])
    setFailedUploads([])
  }

  return {
    uploadQueue,
    completedUploads,
    failedUploads,
    isProcessing,
    processQueue,
    clearQueue,
  }
}