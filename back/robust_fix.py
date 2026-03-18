import psycopg2
import sys

def run_fix():
    try:
        # Connect with explicit encoding and parameters
        conn = psycopg2.connect(host="localhost", dbname="sim", user="admiSim", password="RAqk3TqV1hSGlVooeJHd", port=5432)
        cur = conn.cursor()
        
        # 1. Check specialties
        cur.execute("SELECT id, nombre, es_autogestion FROM especialidades WHERE activo = TRUE")
        rows = cur.fetchall()
        print(f"BEFORE: {rows}")
        
        # 2. Update Odontología
        cur.execute("UPDATE especialidades SET es_autogestion = TRUE WHERE nombre ILIKE '%Odontolog%a%'")
        conn.commit()
        print(f"UPDATED: {cur.rowcount} rows.")
        
        # 3. Check again
        cur.execute("SELECT id, nombre, es_autogestion FROM especialidades WHERE activo = TRUE")
        rows = cur.fetchall()
        print(f"AFTER: {rows}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {repr(e)}")

if __name__ == "__main__":
    run_fix()
