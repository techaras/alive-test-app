'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteUpload } from '@/lib/upload-service'

interface DeleteUploadProps {
  uploadId: string
  onDelete: () => void
}

export function DeleteUpload({ uploadId, onDelete }: DeleteUploadProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (isDeleting) return

    setIsDeleting(true)

    try {
      await deleteUpload(uploadId)
      onDelete()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete upload'
      console.error('Delete error:', errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {isDeleting ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      Delete
    </button>
  )
}