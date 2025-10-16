from database import get_db_connection, ensure_uploads_directory

def initialize_database():
    """
    Initialize the DuckDB database with required tables.
    Creates the uploads metadata table if it doesn't exist.
    """
    conn = get_db_connection()
    
    try:
        # Create uploads metadata table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS uploads (
                upload_id VARCHAR PRIMARY KEY,
                user_id VARCHAR NOT NULL,
                filename VARCHAR NOT NULL,
                uploaded_at TIMESTAMP NOT NULL,
                parquet_path VARCHAR NOT NULL,
                row_count INTEGER,
                column_count INTEGER,
                schema_json JSON
            )
        """)
        
        # Create index on user_id for faster queries
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_uploads_user_id 
            ON uploads(user_id)
        """)
        
        # Create index on uploaded_at for time-based queries
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at 
            ON uploads(uploaded_at)
        """)
        
        print("✓ Database initialized successfully")
        print(f"✓ Database location: {conn.execute('SELECT current_database()').fetchone()[0]}")
        
        # Show table info
        result = conn.execute("""
            SELECT COUNT(*) as total_uploads 
            FROM uploads
        """).fetchone()
        
        print(f"✓ Current uploads in database: {result[0]}")
        
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        raise
    finally:
        conn.close()
    
    # Ensure uploads directory exists
    uploads_dir = ensure_uploads_directory()
    print(f"✓ Uploads directory ready: {uploads_dir}")

if __name__ == "__main__":
    print("Initializing database...")
    initialize_database()
    print("\nDatabase setup complete!")