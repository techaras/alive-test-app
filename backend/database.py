import duckdb
import os
from pathlib import Path

# Database file path
DB_PATH = Path(__file__).parent / "database" / "app.db"
UPLOADS_DIR = Path(__file__).parent / "data" / "uploads"

def get_db_connection():
    """
    Get a DuckDB connection.
    Creates database directory if it doesn't exist.
    """
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return duckdb.connect(str(DB_PATH))

def ensure_uploads_directory():
    """
    Ensure the uploads directory exists.
    """
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    return UPLOADS_DIR

def get_user_upload_directory(user_id: str) -> Path:
    """
    Get or create a user-specific upload directory.
    
    Args:
        user_id: The user's ID from WorkOS
        
    Returns:
        Path to the user's upload directory
    """
    user_dir = UPLOADS_DIR / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir