from app.database.connection import get_db_connection
conn = get_db_connection()
try:
    with conn.cursor() as cur:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'citas'")
        cols = [r[0] for r in cur.fetchall()]
        print(f"COLUMNS: {cols}")
finally:
    conn.close()
