import psycopg2
from app.database.connection import get_db_connection

def check_schemas():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            for table in ['profesionales', 'usuarios']:
                print(f"\n--- TABLE: {table} ---")
                cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
                cols = [c[0] for c in cur.fetchall()]
                print(", ".join(cols))
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    check_schemas()
