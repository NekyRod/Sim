
import sys
import os

# Ensure we are in the back directory to load config correctly
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database.connection import get_db_connection

def check():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        print("CON_OK")
        for table in ['odontograma_historial', 'detalle_diente', 'profesionales', 'procedimientos_personalizados']:
            try:
                cur.execute(f"SELECT * FROM {table} LIMIT 0")
                colnames = [desc[0] for desc in cur.description]
                print(f"TABLE: {table} - COLS: {colnames}")
            except Exception as te:
                print(f"TABLE: {table} - ERROR: {repr(te)}")
                conn.rollback()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DIAGNOSTIC_ERROR: {repr(e)}")

if __name__ == "__main__":
    check()
