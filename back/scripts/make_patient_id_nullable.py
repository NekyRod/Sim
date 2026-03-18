import sys
import os

# Add the parent directory to sys.path to identify the app module
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from app.database.connection import get_db_connection

def migrate():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            print("Altering chat_sessions table...")
            cur.execute("ALTER TABLE chat_sessions ALTER COLUMN patient_id DROP NOT NULL;")
            conn.commit()
            print("Successfully made patient_id nullable.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
