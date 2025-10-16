from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
import asyncio

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/stream")
async def health_stream():
    """
    Server-Sent Events endpoint for real-time health monitoring.
    Sends initial health status and keeps connection alive.
    """
    async def event_generator():
        # Send initial status immediately
        yield {
            "event": "health",
            "data": '{"status": "alive", "service": "FastAPI"}'
        }
        # Then keep connection alive without sending anything
        # The open connection itself proves the backend is alive
        while True:
            await asyncio.sleep(60)  # Idle loop every 60 secs to keep connection alive
   
    return EventSourceResponse(event_generator())