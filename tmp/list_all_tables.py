import os
import sys

# Add the project directory to the python path
sys.path.append('d:\\OneDrive\\Desarr\\Proyectos\\GOI\\back')

from app.database.connection import get_db_connection

def list_all_tables():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT table_schema, table_name 
                FROM information_schema.tables 
                WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
                ORDER BY table_schema, table_name
            """)
            tables = cur.fetchall()
            print("--- ALL TABLES START ---")
            for schema, table in tables:
                print(f"{schema}.{table}")
            print("--- ALL TABLES END ---")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    list_all_tables()
