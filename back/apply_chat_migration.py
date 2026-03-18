import os
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

from app.database.connection import get_db_connection

def apply_migration():
    print("Applying migration...")
    sql_file = "app/database/001_chat_tables.sql"
    
    with open(sql_file, "r", encoding="utf-8") as f:
        sql = f.read()
    
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(sql)
            conn.commit()
        print("Migration applied successfully.")
    except Exception as e:
        print(f"Error applying migration: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    apply_migration()
