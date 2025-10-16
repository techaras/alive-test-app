"""
Helper script to query uploaded data.
Shows how to retrieve metadata and query Parquet files.
"""

from database import get_db_connection
import json
from pathlib import Path

def list_all_uploads():
    """List all uploads in the database."""
    
    conn = get_db_connection()
    
    try:
        result = conn.execute("""
            SELECT 
                upload_id,
                user_id,
                filename,
                uploaded_at,
                row_count,
                column_count
            FROM uploads
            ORDER BY uploaded_at DESC
        """).fetchall()
        
        if not result:
            print("No uploads found in database.")
            return
        
        print(f"\nTotal uploads: {len(result)}\n")
        print("="*80)
        
        for row in result:
            print(f"Upload ID: {row[0]}")
            print(f"User ID: {row[1]}")
            print(f"Filename: {row[2]}")
            print(f"Uploaded: {row[3]}")
            print(f"Dimensions: {row[4]} rows × {row[5]} columns")
            print("-"*80)
        
    finally:
        conn.close()

def query_upload_data(upload_id: str, limit: int = 10):
    """
    Query data from a specific upload.
    
    Args:
        upload_id: The upload ID to query
        limit: Number of rows to return (default 10)
    """
    
    conn = get_db_connection()
    
    try:
        # Get upload metadata
        metadata = conn.execute("""
            SELECT 
                filename,
                parquet_path,
                row_count,
                column_count,
                schema_json
            FROM uploads
            WHERE upload_id = ?
        """, [upload_id]).fetchone()
        
        if not metadata:
            print(f"Upload ID '{upload_id}' not found.")
            return
        
        filename, parquet_path, row_count, col_count, schema_json = metadata
        schema = json.loads(schema_json)
        
        print(f"\nQuerying: {filename}")
        print(f"Upload ID: {upload_id}")
        print(f"Dimensions: {row_count} rows × {col_count} columns")
        print(f"Columns: {', '.join(schema['columns'])}")
        print("\n" + "="*80)
        
        # Build full path to parquet file
        base_path = Path(__file__).parent
        full_parquet_path = base_path / parquet_path
        
        if not full_parquet_path.exists():
            print(f"✗ Parquet file not found: {full_parquet_path}")
            return
        
        # Query the data
        result = conn.execute(f"""
            SELECT * 
            FROM read_parquet('{full_parquet_path}')
            LIMIT {limit}
        """).fetchall()
        
        # Print results
        print(f"\nFirst {min(limit, len(result))} rows:\n")
        
        # Print column headers
        print(" | ".join(schema['columns']))
        print("-" * 80)
        
        # Print data
        for row in result:
            print(" | ".join(str(val) for val in row))
        
        print("\n" + "="*80)
        print(f"Showing {len(result)} of {row_count} total rows")
        
    finally:
        conn.close()

def get_upload_stats(user_id: str = None):
    """
    Get statistics about uploads.
    
    Args:
        user_id: Optional user ID to filter by
    """
    
    conn = get_db_connection()
    
    try:
        if user_id:
            result = conn.execute("""
                SELECT 
                    COUNT(*) as total_uploads,
                    SUM(row_count) as total_rows,
                    AVG(row_count) as avg_rows_per_file,
                    MIN(uploaded_at) as first_upload,
                    MAX(uploaded_at) as last_upload
                FROM uploads
                WHERE user_id = ?
            """, [user_id]).fetchone()
            
            print(f"\nStats for user: {user_id}")
        else:
            result = conn.execute("""
                SELECT 
                    COUNT(*) as total_uploads,
                    SUM(row_count) as total_rows,
                    AVG(row_count) as avg_rows_per_file,
                    MIN(uploaded_at) as first_upload,
                    MAX(uploaded_at) as last_upload
                FROM uploads
            """).fetchone()
            
            print("\nGlobal upload stats:")
        
        print("="*80)
        print(f"Total uploads: {result[0]}")
        print(f"Total rows: {result[1]:,}")
        print(f"Average rows per file: {result[2]:.0f}")
        print(f"First upload: {result[3]}")
        print(f"Last upload: {result[4]}")
        print("="*80)
        
    finally:
        conn.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "list":
            list_all_uploads()
        
        elif command == "query" and len(sys.argv) > 2:
            upload_id = sys.argv[2]
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            query_upload_data(upload_id, limit)
        
        elif command == "stats":
            user_id = sys.argv[2] if len(sys.argv) > 2 else None
            get_upload_stats(user_id)
        
        else:
            print("Usage:")
            print("  python query_uploads.py list")
            print("  python query_uploads.py query <upload_id> [limit]")
            print("  python query_uploads.py stats [user_id]")
    
    else:
        print("Available commands:")
        print("  list   - List all uploads")
        print("  query  - Query specific upload data")
        print("  stats  - Show upload statistics")
        print("\nRun with --help for usage details")