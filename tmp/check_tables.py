import os
import sys

# Add the project directory to the python path
sys.path.append('d:\\OneDrive\\Desarr\\Proyectos\\GOI\\back')

from app.database.connection import get_db_connection

def check_tables():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            tables = cur.fetchall()
            print("Tables in database:")
            for table in tables:
                print(f"- {table[0]}")
    except Exception as e:
        print(f"Error checking tables: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_tables()
