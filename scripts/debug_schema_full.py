import sys
import os

# Add back/ to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../back')))

import psycopg2
from app.config.config import load_config

def check_schema():
    config = load_config()
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
        
        tables = [
            "especialidades", 
            "festivos", 
            "profesionales", 
            "prenombres",
            "profesional_especialidades_secundarias"
        ]

        for table in tables:
            print(f"\nChecking table '{table}'...")
            cur.execute(f"SELECT to_regclass('public.{table}');")
            exists = cur.fetchone()[0]
            if not exists:
                print(f"ERROR: Table '{table}' DOES NOT EXIST.")
            else:
                print(f"Table '{table}' exists.")
                
                # Check columns
                cur.execute(f"""
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = '{table}';
                """)
                cols = cur.fetchall()
                print("Columns:", [c[0] for c in cols])
                
                # Check data count
                try:
                    cur.execute(f"SELECT count(*) FROM {table};")
                    count = cur.fetchone()[0]
                    print(f"Row count: {count}")
                except Exception as e:
                    print(f"Error counting rows in {table}: {e}")
                
        conn.close()
        
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    check_schema()
