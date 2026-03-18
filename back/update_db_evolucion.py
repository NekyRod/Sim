import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.connection import get_db_connection

try:
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute("ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS evolucion_porcentaje INTEGER DEFAULT 100;")
    conn.commit()
    conn.close()
    print("Columna evolucion_porcentaje añadida correctamente a detalle_diente.")
except Exception as e:
    print(f"Error al alterar tabla: {e}")
