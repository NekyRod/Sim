import psycopg2
from app.database.connection import get_db_connection

def check_structure():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            with open('db_schema_output.txt', 'w') as f:
                for table in ['profesionales', 'usuarios']:
                    f.write(f"\n--- TABLE: {table} ---\n")
                    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
                    for row in cur.fetchall():
                        f.write(f"  {row[0]} ({row[1]})\n")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    check_structure()
