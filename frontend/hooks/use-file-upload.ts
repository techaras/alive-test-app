import { useState } from 'react'

interface UseFileUploadProps {
  onSuccess?: () => void
}

export function useFileUpload({ onSuccess }: UseFileUploadProps = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setIsUploading(true)
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
              
              // Reset after a short delay to show completion
              setTimeout(() => {
                setSelectedFile(null)
                setUploadProgress(0)
                setIsUploading(false)
                
                // Call success callback to trigger refetch
                if (onSuccess) {
                  onSuccess()
                }
              }, 1000)
              
              resolve()
            } else {
              throw new Error('Upload failed')
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            setError(errorMessage)
            setIsUploading(false)
            reject(err)
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            throw new Error(errorData.detail || 'Upload failed')
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            setError(errorMessage)
            setIsUploading(false)
            reject(err)
          }
        }
      }

      xhr.onerror = () => {
        setError('Network error occurred')
        setIsUploading(false)
        reject(new Error('Network error'))
      }

      xhr.open('POST', 'http://localhost:8000/api/upload')
      xhr.withCredentials = true
      xhr.send(formData)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        setError('Please select a CSV file')
        return
      }
      
      setSelectedFile(file)
      setError(null)
      uploadFile(file)
    }
  }

  return {
    selectedFile,
    isUploading,
    uploadProgress,
    error,
    handleFileChange,
  }
}