import { useState } from 'react'

interface UseFileUploadProps {
  onSuccess?: () => void
}

interface FailedUpload {
  file: File
  error: string
}

export function useFileUpload({ onSuccess }: UseFileUploadProps = {}) {
  // Current upload state (for progress tracking)
  const [currentUpload, setCurrentUpload] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Queue management
  const [uploadQueue, setUploadQueue] = useState<File[]>([])
  const [completedUploads, setCompletedUploads] = useState<string[]>([])
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([])
  
  // Global state
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File): Promise<void> => {
    setUploadProgress(0)
    setError(null)

    return new Promise<void>((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100
          setUploadProgress(Math.round(percentComplete))
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            
            if (result.success) {
              setUploadProgress(100)
              resolve()
            } else {
              throw new Error('Upload failed')
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            reject(new Error(errorMessage))
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            reject(new Error(errorData.detail || 'Upload failed'))
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            reject(new Error(errorMessage))
          }
        }
      }

      xhr.onerror = () => {
        reject(new Error('Network error occurred'))
      }

      xhr.open('POST', 'http://localhost:8000/api/upload')
      xhr.withCredentials = true
      xhr.send(formData)
    })
  }

  const processQueue = async (filesToUpload: File[]) => {
    setIsUploading(true)
    setCompletedUploads([])
    setFailedUploads([])
    setUploadQueue(filesToUpload)

    for (const file of filesToUpload) {
      setCurrentUpload(file)
      
      // Remove from queue as we start uploading
      setUploadQueue(prev => prev.filter(f => f !== file))

      try {
        await uploadFile(file)
        
        // Mark as completed
        setCompletedUploads(prev => [...prev, file.name])
        
        // Refetch after each successful upload
        if (onSuccess) {
          onSuccess()
        }
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed'
        setFailedUploads(prev => [...prev, { file, error: errorMessage }])
      }
    }

    // All done
    setCurrentUpload(null)
    setUploadProgress(0)
    setIsUploading(false)
  }

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
    processQueue(files)
  }

  const retryFailed = () => {
    const filesToRetry = failedUploads.map(fu => fu.file)
    setFailedUploads([])
    processQueue(filesToRetry)
  }

  return {
    currentUpload,
    uploadProgress,
    uploadQueue,
    completedUploads,
    failedUploads,
    isUploading,
    error,
    handleFileChange,
    retryFailed,
  }
}