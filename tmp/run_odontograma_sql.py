import os
import sys

# Add the project directory to the python path
sys.path.append('d:\\OneDrive\\Desarr\\Proyectos\\GOI\\back')

from app.database.connection import get_db_connection

def run_sql_file(file_path):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            print(f"Reading SQL file: {file_path}")
            with open(file_path, 'r', encoding='utf-8') as f:
                sql = f.read()
            
            print("Executing SQL...")
            cur.execute(sql)
            conn.commit()
            print("SQL executed successfully.")
    except Exception as e:
        print(f"Error executing SQL: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    sql_path = 'd:\\OneDrive\\Desarr\\Proyectos\\GOI\\back\\app\\database\\002_odontograma_tables.sql'
    run_sql_file(sql_path)
