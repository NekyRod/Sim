from app.database.connection import get_db_connection
try:
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'citas'")
        columns = [r[0] for r in cur.fetchall()]
        print(f"COLUMNS_EXIST: {columns}")
except Exception as e:
    print(f"ERROR: {e}")
finally:
    if 'conn' in locals() and conn:
        conn.close()
