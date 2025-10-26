export function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  
  export function formatFileSize(bytes: number): string {
    return (bytes / 1024).toFixed(2) + ' KB'
  }