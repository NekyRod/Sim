
import sys
import os

# Set path to include /app/app
sys.path.append("/app")

try:
    from app.database.connection import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1")
    print("DB_OK")
    cur.close()
    conn.close()
except Exception as e:
    print(f"DB_ERROR: {e}")
