
import sys
import os

# Ensure we are in the back directory to load config correctly
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database.connection import get_db_connection

def fix_and_check():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        print("Fixing detalle_diente...")
        cur.execute("ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS evolucion_porcentaje INTEGER DEFAULT 100;")
        
        print("Checking anamnesis table...")
        try:
            cur.execute("SELECT * FROM anamnesis LIMIT 0")
            colnames = [desc[0] for desc in cur.description]
            print(f"TABLE: anamnesis - COLS: {colnames}")
        except Exception as e:
            print(f"TABLE: anamnesis - ERROR: {repr(e)}")
            conn.rollback()
            
        conn.commit()
        cur.close()
        conn.close()
        print("DONE")
    except Exception as e:
        print(f"ERROR: {repr(e)}")

if __name__ == "__main__":
    fix_and_check()
