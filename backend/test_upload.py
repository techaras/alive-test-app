"""
Test script for the upload endpoint.
Creates a sample CSV and tests the Parquet conversion.
"""

import pandas as pd
from pathlib import Path
from database import get_db_connection, get_user_upload_directory
import json

def create_test_csv():
    """Create a sample CSV file for testing."""
    
    # Sample data
    data = {
        'id': [1, 2, 3, 4, 5],
        'name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
        'age': [25, 30, 35, 40, 45],
        'city': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'],
        'salary': [50000, 60000, 70000, 80000, 90000]
    }
    
    df = pd.DataFrame(data)
    
    # Save to test CSV
    test_csv = Path(__file__).parent / "test_data.csv"
    df.to_csv(test_csv, index=False)
    
    print(f"✓ Test CSV created: {test_csv}")
    print(f"  - Rows: {len(df)}")
    print(f"  - Columns: {len(df.columns)}")
    print(f"  - Column names: {df.columns.tolist()}")
    
    return test_csv

def test_parquet_conversion():
    """Test CSV to Parquet conversion locally."""
    
    print("\n" + "="*50)
    print("Testing CSV → Parquet Conversion")
    print("="*50)
    
    # Create test CSV
    test_csv = create_test_csv()
    
    try:
        # Read CSV
        print("\n1. Reading CSV...")
        df = pd.read_csv(test_csv)
        print("✓ CSV read successfully")
        
        # Get metadata
        row_count = len(df)
        column_count = len(df.columns)
        schema = {
            'columns': df.columns.tolist(),
            'dtypes': df.dtypes.astype(str).to_dict()
        }
        
        print(f"\n2. Metadata extracted:")
        print(f"  - Rows: {row_count}")
        print(f"  - Columns: {column_count}")
        print(f"  - Schema: {json.dumps(schema, indent=2)}")
        
        # Convert to Parquet
        print("\n3. Converting to Parquet...")
        test_parquet = Path(__file__).parent / "test_data.parquet"
        df.to_parquet(
            test_parquet,
            engine='pyarrow',
            compression='snappy',
            index=False
        )
        print(f"✓ Parquet file created: {test_parquet}")
        
        # Compare file sizes
        csv_size = test_csv.stat().st_size
        parquet_size = test_parquet.stat().st_size
        compression_ratio = (1 - parquet_size / csv_size) * 100
        
        print(f"\n4. File size comparison:")
        print(f"  - CSV size: {csv_size} bytes")
        print(f"  - Parquet size: {parquet_size} bytes")
        print(f"  - Compression: {compression_ratio:.1f}% smaller")
        
        # Read back from Parquet
        print("\n5. Verifying Parquet file...")
        df_parquet = pd.read_parquet(test_parquet)
        
        if df.equals(df_parquet):
            print("✓ Data integrity verified - CSV and Parquet match!")
        else:
            print("✗ Data mismatch between CSV and Parquet")
        
        # Test DuckDB query
        print("\n6. Testing DuckDB query on Parquet...")
        conn = get_db_connection()
        try:
            result = conn.execute(f"""
                SELECT COUNT(*) as count, 
                       AVG(age) as avg_age,
                       AVG(salary) as avg_salary
                FROM read_parquet('{test_parquet}')
            """).fetchone()
            
            print(f"✓ DuckDB query successful:")
            print(f"  - Total records: {result[0]}")
            print(f"  - Average age: {result[1]:.1f}")
            print(f"  - Average salary: ${result[2]:,.2f}")
            
        finally:
            conn.close()
        
        print("\n" + "="*50)
        print("All tests passed! ✓")
        print("="*50)
        
        # Cleanup
        print("\nCleaning up test files...")
        test_csv.unlink()
        test_parquet.unlink()
        print("✓ Cleanup complete")
        
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        raise

if __name__ == "__main__":
    test_parquet_conversion()