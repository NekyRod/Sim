import psycopg2
import os

def check_db():
    # Use hardcoded connection params for debugging if needed, 
    # but try env vars first or typical ones from connection.py
    try:
        # Replicating get_db_connection logic from app.database.connection
        # usually it reads from env or config.
        # Let's assume typical local setup from conversation metadata or common patterns here.
        conn = psycopg2.connect(
            host="localhost",
            dbname="sim_odont", # or typical name
            user="postgres",
            password="password", # or typical
            port=5432
        )
        cur = conn.cursor()
        
        print("Checking specializes table columns...")
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'especialidades';")
        cols = cur.fetchall()
        for c in cols:
            print(f"Column: {c[0]}, Type: {c[1]}")
            
        print("\nChecking autogestion specialties...")
        cur.execute("SELECT id, nombre, es_autogestion FROM especialidades WHERE activo = TRUE;")
        specs = cur.fetchall()
        for s in specs:
            print(f"ID: {s[0]}, Name: {s[1]}, Autogestion: {s[2]}")
            
        conn.close()
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    check_db()
