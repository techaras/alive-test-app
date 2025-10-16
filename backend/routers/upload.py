from fastapi import APIRouter, Request, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import pandas as pd
import json
import uuid
from datetime import datetime
from pathlib import Path
from config import workos, WORKOS_COOKIE_PASSWORD
from database import get_db_connection, get_user_upload_directory

router = APIRouter(prefix="/api", tags=["upload"])


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
    
    # 1. Check authentication
    try:
        session = workos.user_management.load_sealed_session(
            sealed_session=request.cookies.get("wos_session"),
            cookie_password=WORKOS_COOKIE_PASSWORD,
        )
        auth_response = session.authenticate()
        
        if not auth_response.authenticated:
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        user = auth_response.user
        user_id = user.id
        
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
                datetime.now(),
                relative_path,
                row_count,
                column_count,
                schema_json
            ])
            
        finally:
            conn.close()
        
        # 8. Return success response
        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "File uploaded successfully",
                "data": {
                    "upload_id": upload_id,
                    "filename": file.filename,
                    "row_count": row_count,
                    "column_count": column_count,
                    "columns": schema['columns'],
                    "uploaded_at": datetime.now().isoformat()
                }
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