import psycopg2
from app.database.connection import get_db_connection

def check_data():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            print("--- DATA PROFESIONALES (Top 3) ---")
            cur.execute("SELECT id, nombre, apellidos, numero_identificacion, correo FROM profesionales LIMIT 3")
            for row in cur.fetchall():
                print(row)
            
            print("\n--- DATA USUARIOS (Top 3) ---")
            cur.execute("SELECT id, username, rol FROM usuarios LIMIT 3")
            for row in cur.fetchall():
                print(row)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    check_data()
