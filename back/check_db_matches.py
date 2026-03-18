import psycopg2
from app.database.connection import get_db_connection

def find_matches():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT u.id as user_id, u.username, p.id as prof_id, p.nombre, p.apellidos
                FROM usuarios u
                JOIN profesionales p ON u.username = p.numero_identificacion OR u.username = p.correo
            """)
            matches = cur.fetchall()
            print("--- MATCHES FOUND ---")
            for m in matches:
                print(f"Match: User {m[1]} (id:{m[0]}) matches Prof {m[3]} {m[4]} (id:{m[2]})")
            
            if not matches:
                print("No direct matches found between username and ID/Email.")
                
                # Check for "admin" link
                cur.execute("SELECT id, username FROM usuarios WHERE username = 'admin'")
                admin_user = cur.fetchone()
                if admin_user:
                    print(f"\nFound admin user (id:{admin_user[0]})")
                    cur.execute("SELECT id, nombre FROM profesionales WHERE nombre ILIKE '%admin%'")
                    admin_prof = cur.fetchone()
                    if admin_prof:
                        print(f"Found admin professional (id:{admin_prof[0]})")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    find_matches()
