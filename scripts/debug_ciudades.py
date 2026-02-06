import sys
import os

# Add back/ to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../back')))

import psycopg2
from app.config.config import load_config

def check_ciudades():
    config = load_config()
    if not config:
        # Fallback manual config if load_config fails (it reads app.conf which might depend on cwd)
        # But let's try to mimic connection.py
        print("Could not load config via app.config.config")
        return

    print(f"Config loaded: host={config.get('host')}, dbname={config.get('dbname')}")

    try:
        conn = psycopg2.connect(
            host=config.get("host", "localhost"),
            dbname=config.get("dbname"),
            user=config.get("user"),
            password=config.get("password"),
            port=config.get("port", 5432)
        )
        cur = conn.cursor()
        
        # Check table existence
        cur.execute("SELECT to_regclass('public.ciudades_residencia');")
        exists = cur.fetchone()[0]
        if not exists:
            print("ERROR: Table 'ciudades_residencia' DOES NOT EXIST.")
        else:
            print("Table 'ciudades_residencia' exists.")
            
            # Check columns
            cur.execute("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'ciudades_residencia';
            """)
            cols = cur.fetchall()
            print("Columns:", cols)
            
            # Check data
            cur.execute("SELECT count(*) FROM ciudades_residencia;")
            count = cur.fetchone()[0]
            print(f"Row count: {count}")
            
            if count > 0:
                cur.execute("SELECT * FROM ciudades_residencia LIMIT 5;")
                rows = cur.fetchall()
                print("First 5 rows:", rows)
                
        conn.close()
        
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    check_ciudades()
