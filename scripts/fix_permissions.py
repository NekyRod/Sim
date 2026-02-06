import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

HOST = "localhost"
PORT = "5432"
USER = "postgres"
PASSWORD = "0728"
DB_NAME = "sim"

def grant_permissions():
    try:
        conn = psycopg2.connect(host=HOST, port=PORT, user=USER, password=PASSWORD, dbname=DB_NAME)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Otorgando permisos a 'admisim' (lowercase)...")
        # Grant usage on schema
        cur.execute("GRANT USAGE ON SCHEMA public TO admisim;")
        # Grant all on tables
        cur.execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admisim;")
        # Grant all on sequences
        cur.execute("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admisim;")
        
        print("Permisos otorgados correctamente.")
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    grant_permissions()
