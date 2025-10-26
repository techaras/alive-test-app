export const dynamic = 'force-dynamic'

export async function GET() {
    let cancelled = false
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Connect to FastAPI SSE endpoint
                const response = await fetch('http://localhost:8000/health/stream', {
                    method: 'GET',
                    headers: {
                        'Accept': 'text/event-stream',
                    },
                })

                if (!response.ok) {
                    controller.close()
                    return
                }

                const streamReader = response.body?.getReader()
                if (!streamReader) {
                    controller.close()
                    return
                }
                
                reader = streamReader

                // Read and forward SSE data
                while (!cancelled) {
                    const { done, value } = await reader.read()
                    
                    if (done || cancelled) {
                        break
                    }

                    // Forward the SSE data to the client
                    if (!cancelled) {
                        try {
                            controller.enqueue(value)
                        } catch {
                            // Controller was closed (client disconnected)
                            break
                        }
                    }
                }
            } catch (error) {
                console.error('SSE proxy error:', error)
            } finally {
                // Clean up
                if (reader) {
                    try {
                        await reader.cancel()
                    } catch {
                        // Ignore cancellation errors
                    }
                }
                try {
                    controller.close()
                } catch {
                    // Already closed
                }
            }
        },
        cancel() {
            cancelled = true
            console.log('Client disconnected from SSE stream')
        },
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}