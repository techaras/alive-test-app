import { useState } from 'react'
import { useUploadQueue } from './use-upload-queue'

interface UseFileUploadProps {
  onSuccess?: () => void
}

export function useFileUpload({ onSuccess }: UseFileUploadProps = {}) {
  const [currentUpload, setCurrentUpload] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const {
    uploadQueue,
    completedUploads,
    failedUploads,
    isProcessing,
    processQueue,
  } = useUploadQueue({ onSuccess })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    // Validate all files are CSV
    const invalidFiles = files.filter(
      file => !file.name.endsWith('.csv') && file.type !== 'text/csv'
    )

    if (invalidFiles.length > 0) {
      setError(`Invalid file type: ${invalidFiles.map(f => f.name).join(', ')}`)
      return
    }

    setError(null)
    
    processQueue(
      files,
      (file) => {
        setCurrentUpload(file)
        setUploadProgress(0)
      },
      (percentage) => {
        setUploadProgress(percentage)
      },
      () => {
        // File completed
      },
      () => {
        // File errored
      }
    ).then(() => {
      setCurrentUpload(null)
      setUploadProgress(0)
    })
  }

  const retryFailed = () => {
    const filesToRetry = failedUploads.map(fu => fu.file)
    
    processQueue(
      filesToRetry,
      (file) => {
        setCurrentUpload(file)
        setUploadProgress(0)
      },
      (percentage) => {
        setUploadProgress(percentage)
      },
      () => {
        // File completed
      },
      () => {
        // File errored
      }
    ).then(() => {
      setCurrentUpload(null)
      setUploadProgress(0)
    })
  }

  return {
    currentUpload,
    uploadProgress,
    uploadQueue,
    completedUploads,
    failedUploads,
    isUploading: isProcessing,
    error,
    handleFileChange,
    retryFailed,
  }
}