"""
Test script to verify database setup.
Run this after installing dependencies and running db_setup.py
"""

from database import get_db_connection, get_user_upload_directory
import json
from datetime import datetime

def test_database():
    """Test database connection and basic operations."""
    
    print("Testing database connection...")
    conn = get_db_connection()
    
    try:
        # Test 1: Insert a test upload
        print("\n1. Testing insert operation...")
        test_data = {
            'upload_id': 'test-123',
            'user_id': 'test-user',
            'filename': 'test.csv',
            'uploaded_at': datetime.now(),
            'parquet_path': '/data/uploads/test-user/test-123.parquet',
            'row_count': 100,
            'column_count': 5,
            'schema_json': json.dumps({'columns': ['col1', 'col2', 'col3', 'col4', 'col5']})
        }
        
        conn.execute("""
            INSERT INTO uploads VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            test_data['upload_id'],
            test_data['user_id'],
            test_data['filename'],
            test_data['uploaded_at'],
            test_data['parquet_path'],
            test_data['row_count'],
            test_data['column_count'],
            test_data['schema_json']
        ])
        print("✓ Insert successful")
        
        # Test 2: Query the data back
        print("\n2. Testing query operation...")
        result = conn.execute("""
            SELECT * FROM uploads WHERE upload_id = ?
        """, ['test-123']).fetchone()
        
        if result:
            print("✓ Query successful")
            print(f"  - Upload ID: {result[0]}")
            print(f"  - User ID: {result[1]}")
            print(f"  - Filename: {result[2]}")
            print(f"  - Uploaded at: {result[3]}")
        else:
            print("✗ Query failed - no data returned")
        
        # Test 3: Test user directory creation
        print("\n3. Testing user directory creation...")
        user_dir = get_user_upload_directory('test-user')
        print(f"✓ User directory created: {user_dir}")
        
        # Test 4: Clean up test data
        print("\n4. Cleaning up test data...")
        conn.execute("DELETE FROM uploads WHERE upload_id = ?", ['test-123'])
        print("✓ Cleanup successful")
        
        print("\n" + "="*50)
        print("All tests passed! ✓")
        print("="*50)
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    test_database()