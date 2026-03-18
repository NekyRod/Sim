import psycopg2
from psycopg2.extras import RealDictCursor
from app.database.connection import get_db_connection

try:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios';")
            columns = cur.fetchall()
            print("Columns in 'usuarios':")
            for col in columns:
                print(f" - {col['column_name']}")
            
            cur.execute("SELECT id, username, rol, activo FROM usuarios LIMIT 5;")
            users = cur.fetchall()
            print("Users in 'usuarios':")
            for u in users:
                print(f" - ID: {u['id']}, Username: {u['username']}, Role: {u['rol']}, Active: {u['activo']}")
except Exception as e:
    print(f"Error: {e}")
