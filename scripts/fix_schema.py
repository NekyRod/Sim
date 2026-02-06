import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import sys

# Configuración
HOST = "localhost"
PORT = "5432"
DB_NAME = "sim"
USER = "admiSim"
PASSWORD = "RAqk3TqV1hSGlVooeJHd"

def get_connection():
    return psycopg2.connect(
        host=HOST,
        port=PORT,
        dbname=DB_NAME,
        user=USER,
        password=PASSWORD
    )

def fix_schema():
    print("Iniciando reparación de esquema...")
    conn = get_connection()
    conn.autocommit = True
    cur = conn.cursor()

    try:
        # 1. Fix 'disponibilidades' table
        # The SQL schema defined 'fecha' (DATE) but the code uses 'dia_semana' (INT).
        # We will check if the table has 'dia_semana'. If not, we drop and recreate.
        print("Verificando tabla 'disponibilidades'...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='disponibilidades' AND column_name='dia_semana';
        """)
        if not cur.fetchone():
            print("  Detectada estructura incorrecta (falta 'dia_semana'). Recreando tabla...")
            cur.execute("DROP TABLE IF EXISTS disponibilidades;")
            cur.execute("""
                CREATE TABLE disponibilidades (
                    id SERIAL PRIMARY KEY,
                    profesional_id INT REFERENCES public.profesionales(id),
                    dia_semana INT NOT NULL,
                    hora_inicio TIME NOT NULL,
                    hora_fin TIME NOT NULL,
                    activo BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """)
            print("  Tabla 'disponibilidades' recreada con éxito.")
        else:
            print("  Tabla 'disponibilidades' ya tiene 'dia_semana'.")

        # 2. Fix 'citas' table
        # The code uses 'mas_6_meses', but the SQL schema didn't include it.
        print("Verificando tabla 'citas'...")
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='citas' AND column_name='mas_6_meses';
        """)
        if not cur.fetchone():
            print("  Falta columna 'mas_6_meses'. Agregándola...")
            cur.execute("ALTER TABLE citas ADD COLUMN mas_6_meses BOOLEAN DEFAULT FALSE;")
            print("  Columna 'mas_6_meses' agregada.")
        else:
            print("  Columna 'mas_6_meses' ya existe.")

        print("\nReparación completada con éxito.")

    except Exception as e:
        print(f"\n[ERROR] Falló la reparación del esquema: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix_schema()
