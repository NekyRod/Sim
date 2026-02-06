import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

HOST = "localhost"
PORT = "5432"
# Conectamos como postgres para ver roles
USER = "postgres"
PASSWORD = "0728" # Recuperado de turnos anteriores

def check_roles():
    try:
        conn = psycopg2.connect(host=HOST, port=PORT, user=USER, password=PASSWORD, dbname="postgres")
        cur = conn.cursor()
        cur.execute("SELECT rolname FROM pg_roles")
        roles = [r[0] for r in cur.fetchall()]
        print("Roles encontrados:", roles)
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    check_roles()
