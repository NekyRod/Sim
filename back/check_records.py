
import sys
import os

# Ensure we are in the back directory to load config correctly
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database.connection import get_db_connection

def check_data():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        paciente_id = 1
        print(f"--- Checking Records for Patient {paciente_id} ---")
        
        # Check all records
        cur.execute("SELECT id, estado, registrado_por, fecha_registro FROM odontograma_historial WHERE paciente_id = %s", (paciente_id,))
        rows = cur.fetchall()
        print(f"Found {len(rows)} records in odontograma_historial.")
        for r in rows:
            print(f"ID: {r[0]}, Estado: {r[1]}, Registrado por: {r[2]}, Fecha: {r[3]}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"ERROR: {repr(e)}")

if __name__ == "__main__":
    check_data()
