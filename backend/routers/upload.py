from fastapi import APIRouter, Request, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, Response
import pandas as pd
import json
import uuid
from datetime import datetime
from pathlib import Path
from config import workos, WORKOS_COOKIE_PASSWORD
from database import get_db_connection, get_user_upload_directory

router = APIRouter(prefix="/api", tags=["upload"])


@router.get("/uploads")
async def get_uploads(request: Request):
    """
    Get all uploads for the authenticated user.
    
    Returns:
        JSON response with list of uploads
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
    
    # Fetch uploads from database
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
        
        return JSONResponse(
            status_code=200,
            content={"uploads": uploads}
        )
    finally:
        conn.close()


@router.delete("/upload/{upload_id}")
async def delete_upload(upload_id: str, request: Request):
    """
    Delete an upload and its associated Parquet file.
    
    Args:
        upload_id: The UUID of the upload to delete
        request: FastAPI request object (for session)
        
    Returns:
        204 No Content on success
        404 if upload not found or doesn't belong to user
        401 if not authenticated
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
                
                # Session refreshed successfully - use the new user
                user_id = refresh_result.user.id
            except Exception as refresh_error:
                raise HTTPException(status_code=401, detail="Session expired")
        else:
            user_id = auth_response.user.id
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")
    
    # Get upload metadata from database
    conn = get_db_connection()
    try:
        result = conn.execute("""
            SELECT parquet_path, user_id
            FROM uploads
            WHERE upload_id = ?
        """, [upload_id]).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        parquet_path, upload_user_id = result
        
        # Verify the upload belongs to the authenticated user
        if upload_user_id != user_id:
            raise HTTPException(status_code=404, detail="Upload not found")
        
        # Delete the Parquet file from filesystem
        full_path = Path(__file__).parent.parent / parquet_path
        if full_path.exists():
            full_path.unlink()
        
        # Delete the record from database
        conn.execute("""
            DELETE FROM uploads
            WHERE upload_id = ?
        """, [upload_id])
        
        return Response(status_code=204)
        
    finally:
        conn.close()


@router.post("/upload")
async def upload_csv(
    request: Request,
    file: UploadFile = File(...)
):
    """
    Upload a CSV file, convert to Parquet, and store metadata.
    
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
        
        # 9. Return success response
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