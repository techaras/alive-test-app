export const dynamic = 'force-dynamic'

export async function GET() {

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

                const reader = response.body?.getReader()
                if (!reader) {
                    controller.close()
                    return
                }

                // Read and forward SSE data
                while (true) {
                    const { done, value } = await reader.read()
                    
                    if (done) {
                        controller.close()
                        break
                    }

                    // Forward the SSE data to the client
                    controller.enqueue(value)
                }
            } catch (error) {
                console.error('SSE proxy error:', error)
                controller.close()
            }
        },
        cancel() {
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