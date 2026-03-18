import os
import sys

# Add the project directory to the python path
sys.path.append('d:\\OneDrive\\Desarr\\Proyectos\\GOI\\back')

from app.database.connection import get_db_connection

def update_schema():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            print("Updating anamnesis table...")
            cur.execute("""
                ALTER TABLE anamnesis 
                ADD COLUMN IF NOT EXISTS motivo_consulta TEXT,
                ADD COLUMN IF NOT EXISTS escala_dolor INTEGER,
                ADD COLUMN IF NOT EXISTS cie10_codigo VARCHAR(20),
                ADD COLUMN IF NOT EXISTS cie10_texto TEXT;
            """)
            
            print("Updating detalle_diente table...")
            cur.execute("""
                ALTER TABLE detalle_diente
                ADD COLUMN IF NOT EXISTS hallazgo TEXT,
                ADD COLUMN IF NOT EXISTS plan_tratamiento TEXT,
                ADD COLUMN IF NOT EXISTS cie10_codigo VARCHAR(20),
                ADD COLUMN IF NOT EXISTS cie10_texto TEXT;
            """)
            
            conn.commit()
            print("Schema updated successfully.")
    except Exception as e:
        print(f"Error updating schema: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema()
