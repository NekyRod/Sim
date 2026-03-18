from app.database.connection import get_db_connection

print("Testing backend DB connection...")
try:
    conn = get_db_connection()
    print("✓ Connection successful!")
    with conn.cursor() as cur:
        cur.execute("SELECT version();")
        print(f"Version: {cur.fetchone()}")
    conn.close()
except Exception as e:
    print(f"✗ Connection failed: {e}")
