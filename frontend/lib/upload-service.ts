export interface UploadProgress {
    loaded: number
    total: number
    percentage: number
  }
  
  export async function uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
  
      const xhr = new XMLHttpRequest()
  
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage,
          })
        }
      }
  
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText)
            
            if (result.success) {
              resolve()
            } else {
              reject(new Error('Upload failed'))
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