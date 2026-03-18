import sys
import os
sys.path.append(os.getcwd())
try:
    from app.database.connection import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_notifications';")
    if cur.fetchone():
        print("TABLE_EXISTS: chat_notifications")
    else:
        print("TABLE_MISSING: chat_notifications")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
