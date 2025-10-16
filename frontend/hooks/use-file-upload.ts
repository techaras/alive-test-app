import { useState } from 'react'

export function useFileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadedAt, setUploadedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    setUploadSuccess(false)
    setUploadedAt(null)

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
              setUploadSuccess(true)
              setUploadedAt(result.data.uploaded_at)
              resolve()
            } else {
              throw new Error('Upload failed')
            }
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            setError(errorMessage)
            setUploadSuccess(false)
            reject(err)
          }
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText)
            throw new Error(errorData.detail || 'Upload failed')
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed'
            setError(errorMessage)
            setUploadSuccess(false)
            reject(err)
          }
        }
        setIsUploading(false)
      }

      xhr.onerror = () => {
        setError('Network error occurred')
        setUploadSuccess(false)
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

  const handleRemove = () => {
    setSelectedFile(null)
    setUploadSuccess(false)
    setUploadedAt(null)
    setUploadProgress(0)
    setError(null)
  }

  return {
    selectedFile,
    isUploading,
    uploadProgress,
    uploadSuccess,
    uploadedAt,
    error,
    handleFileChange,
    handleRemove,
  }
}