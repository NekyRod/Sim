import psycopg2
import sys

def final_check():
    try:
        conn = psycopg2.connect(host="localhost", dbname="sim", user="admiSim", password="RAqk3TqV1hSGlVooeJHd", port=5432)
        cur = conn.cursor()
        
        # Enable it
        cur.execute("UPDATE especialidades SET es_autogestion = TRUE WHERE nombre ILIKE '%Odontolog%a%';")
        conn.commit()
        
        # Verify
        cur.execute("SELECT id, nombre, es_autogestion FROM especialidades WHERE activo = TRUE;")
        rows = cur.fetchall()
        print("Specialties State:")
        for r in rows:
            print(f"- {r[1]}: Autogestion={r[2]}")
            
        conn.close()
    except Exception as e:
        # Repr to avoid encoding issues with the error object itself if possible
        print(f"ERROR: {repr(e)}")

if __name__ == "__main__":
    final_check()
