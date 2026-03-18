import psycopg2
from app.database.connection import get_db_connection

def check_nexus():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            print("--- USUARIOS ---")
            cur.execute("SELECT id, username FROM usuarios")
            users = cur.fetchall()
            for u in users:
                print(f"User ID: {u[0]}, Username: {u[1]}")
            
            print("\n--- PROFESIONALES ---")
            cur.execute("SELECT id, nombre, apellidos, numero_identificacion, correo FROM profesionales")
            profs = cur.fetchall()
            for p in profs:
                print(f"Prof ID: {p[0]}, Name: {p[1]} {p[2]}, ID: {p[3]}, Email: {p[4]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    check_nexus()
