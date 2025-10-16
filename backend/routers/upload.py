from fastapi import APIRouter, Request, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
import pandas as pd
import json
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
from typing import AsyncGenerator
from config import workos, WORKOS_COOKIE_PASSWORD
from database import get_db_connection, get_user_upload_directory

router = APIRouter(prefix="/api", tags=["upload"])

# In-memory queue for broadcasting upload events
upload_queues: dict[str, list[asyncio.Queue]] = {}


def broadcast_upload_event(user_id: str, event_data: dict):
    """
    Broadcast an upload event to all connected clients for a specific user.
    
    Args:
        user_id: The user ID to broadcast to
        event_data: The event data to send
    """
    if user_id in upload_queues:
        # Send event to all queues for this user
        for queue in upload_queues[user_id]:
            try:
                queue.put_nowait(event_data)
            except asyncio.QueueFull:
                pass  # Skip if queue is full


@router.get("/uploads/stream")
async def uploads_stream(request: Request):
    """
    Server-Sent Events endpoint for real-time upload notifications.
    Sends initial upload list on connection, then streams new uploads.
    """
    # Check authentication with session refresh support
    try:
        session = workos.user_management.load_sealed_session(
            sealed_session=request.cookies.get("wos_session"),
            cookie_password=WORKOS_COOKIE_PASSWORD,
        )
        auth_response = session.authenticate()
        
        # If not authenticated, attempt to refresh the session
        if not auth_response.authenticated:
            if auth_response.reason == "no_session_cookie_provided":
                raise HTTPException(status_code=401, detail="No session cookie")
            
            # Try to refresh the session
            try:
                refresh_result = session.refresh()
                if not refresh_result.authenticated:
                    raise HTTPException(status_code=401, detail="Session refresh failed")
                
                # Session refreshed successfully - use the new session
                user_id = refresh_result.user.id
            except Exception as refresh_error:
                raise HTTPException(status_code=401, detail="Session expired")
        else:
            user_id = auth_response.user.id
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    async def event_generator() -> AsyncGenerator[dict, None]:
        # Create a queue for this connection
        queue: asyncio.Queue = asyncio.Queue(maxsize=10)
        
        # Register this queue for the user
        if user_id not in upload_queues:
            upload_queues[user_id] = []
        upload_queues[user_id].append(queue)
        
        try:
            # Send initial connection event
            yield {
                "event": "connected",
                "data": json.dumps({"status": "connected", "user_id": user_id})
            }
            
            # Send initial data immediately via SSE
            conn = get_db_connection()
            try:
                result = conn.execute("""
                    SELECT 
                        upload_id,
                        filename,
                        uploaded_at,
                        row_count,
                        column_count,
                        schema_json
                    FROM uploads
                    WHERE user_id = ?
                    ORDER BY uploaded_at DESC
                """, [user_id]).fetchall()
                
                uploads = []
                for row in result:
                    schema = json.loads(row[5])
                    uploads.append({
                        "upload_id": row[0],
                        "filename": row[1],
                        "uploaded_at": row[2].isoformat() if row[2] else None,
                        "row_count": row[3],
                        "column_count": row[4],
                        "columns": schema.get('columns', [])
                    })
                
                yield {
                    "event": "initial",
                    "data": json.dumps({"uploads": uploads})
                }
            finally:
                conn.close()
            
            # Listen for new upload events
            while True:
                # Wait for new events with timeout to keep connection alive
                try:
                    event_data = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield {
                        "event": "upload",
                        "data": json.dumps(event_data)
                    }
                except asyncio.TimeoutError:
                    # Send keepalive ping every 30 seconds
                    yield {
                        "event": "ping",
                        "data": json.dumps({"status": "alive"})
                    }
                    
        finally:
            # Clean up: remove this queue when client disconnects
            if user_id in upload_queues:
                upload_queues[user_id].remove(queue)
                if not upload_queues[user_id]:
                    del upload_queues[user_id]
    
    return EventSourceResponse(event_generator())


@router.post("/upload")
async def upload_csv(
    request: Request,
    file: UploadFile = File(...)
):
    """
    Upload a CSV file, convert to Parquet, and store metadata.
    Broadcasts event to connected SSE clients.
    
    Args:
        request: FastAPI request object (for session)
        file: The uploaded CSV file
        
    Returns:
        JSON response with upload details
    """
    
    # 1. Check authentication with session refresh support
    try:
        session = workos.user_management.load_sealed_session(
            sealed_session=request.cookies.get("wos_session"),
            cookie_password=WORKOS_COOKIE_PASSWORD,
        )
        auth_response = session.authenticate()
        
        # If not authenticated, attempt to refresh the session
        if not auth_response.authenticated:
            if auth_response.reason == "no_session_cookie_provided":
                raise HTTPException(status_code=401, detail="No session cookie")
            
            # Try to refresh the session
            try:
                refresh_result = session.refresh()
                if not refresh_result.authenticated:
                    raise HTTPException(status_code=401, detail="Session refresh failed")
                
                # Session refreshed successfully - use the new user
                user = refresh_result.user
                user_id = user.id
            except Exception as refresh_error:
                raise HTTPException(status_code=401, detail="Session expired")
        else:
            user = auth_response.user
            user_id = user.id
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    # 2. Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400, 
            detail="Only CSV files are allowed"
        )
    
    # 3. Generate unique upload ID
    upload_id = str(uuid.uuid4())
    
    try:
        # 4. Read CSV file
        contents = await file.read()
        
        # Try different encodings
        try:
            df = pd.read_csv(
                pd.io.common.BytesIO(contents),
                encoding='utf-8'
            )
        except UnicodeDecodeError:
            # Fallback to latin-1 if utf-8 fails
            df = pd.read_csv(
                pd.io.common.BytesIO(contents),
                encoding='latin-1'
            )
        
        # 5. Get metadata
        row_count = len(df)
        column_count = len(df.columns)
        
        # Store schema as JSON
        schema = {
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.astype(str).to_dict()
        }
        schema_json = json.dumps(schema)
        
        # 6. Save as Parquet
        user_dir = get_user_upload_directory(user_id)
        parquet_filename = f"{upload_id}.parquet"
        parquet_path = user_dir / parquet_filename
        
        # Convert to Parquet with compression
        df.to_parquet(
            parquet_path,
            engine='pyarrow',
            compression='snappy',
            index=False
        )
        
        # Store relative path for portability
        relative_path = str(parquet_path.relative_to(Path(__file__).parent.parent))
        
        # 7. Insert metadata into database
        conn = get_db_connection()
        uploaded_at = datetime.now()
        
        try:
            conn.execute("""
                INSERT INTO uploads (
                    upload_id,
                    user_id,
                    filename,
                    uploaded_at,
                    parquet_path,
                    row_count,
                    column_count,
                    schema_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                upload_id,
                user_id,
                file.filename,
                uploaded_at,
                relative_path,
                row_count,
                column_count,
                schema_json
            ])
            
        finally:
            conn.close()
        
        # 8. Prepare response data
        upload_data = {
            "upload_id": upload_id,
            "filename": file.filename,
            "row_count": row_count,
            "column_count": column_count,
            "columns": schema['columns'],
            "uploaded_at": uploaded_at.isoformat()
        }
        
        # 9. Broadcast event to SSE clients
        broadcast_upload_event(user_id, upload_data)
        
        # 10. Return success response
        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "File uploaded successfully",
                "data": upload_data
            }
        )
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    
    except pd.errors.ParserError as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to parse CSV: {str(e)}"
        )
    
    except Exception as e:
        # Clean up parquet file if it was created
        if 'parquet_path' in locals() and parquet_path.exists():
            parquet_path.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )