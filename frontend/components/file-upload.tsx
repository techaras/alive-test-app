'use client'

import { useState } from 'react'
import { Upload, X, FileIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FileUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate CSV file type
      if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
        alert('Please select a CSV file')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleRemove = () => {
    setSelectedFile(null)
  }

  const handleUpload = () => {
    if (!selectedFile) return
    // TODO: Add upload logic here
    console.log('Uploading:', selectedFile)
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
        />
      </label>

      {selectedFile && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
          <FileIcon className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button
        onClick={handleUpload}
        disabled={!selectedFile}
        className="w-full"
      >
        Upload File
      </Button>
    </div>
  )
}