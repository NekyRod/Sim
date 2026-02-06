import sys
import os

# Add back/ to path to import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../back')))

import psycopg2
from app.config.config import load_config

def seed_data():
    config = load_config()
    if not config:
        print("Could not load config.")
        return

    try:
        conn = psycopg2.connect(
            host=config.get("host", "localhost"),
            dbname=config.get("dbname"),
            user=config.get("user"),
            password=config.get("password"),
            port=config.get("port", 5432)
        )
        cur = conn.cursor()
        
        print("Seeding Especialidades...")
        cur.execute("INSERT INTO especialidades (codigo, nombre, activo) VALUES ('MED', 'Medicina General', true) ON CONFLICT DO NOTHING;")
        cur.execute("INSERT INTO especialidades (codigo, nombre, activo) VALUES ('ODO', 'Odontología', true) ON CONFLICT DO NOTHING;")
        cur.execute("INSERT INTO especialidades (codigo, nombre, activo) VALUES ('PED', 'Pediatría', true) ON CONFLICT DO NOTHING;")
        
        print("Seeding Festivos...")
        cur.execute("INSERT INTO festivos (fecha, descripcion) VALUES ('2026-01-01', 'Año Nuevo') ON CONFLICT DO NOTHING;")
        cur.execute("INSERT INTO festivos (fecha, descripcion) VALUES ('2026-12-25', 'Navidad') ON CONFLICT DO NOTHING;")

        print("Seeding Profesionales...")
        # Get an especialidad ID
        cur.execute("SELECT id FROM especialidades WHERE codigo='MED';")
        med_id = cur.fetchone()[0]
        
        # Get a prenombre ID (assuming table has data)
        cur.execute("SELECT id FROM prenombres LIMIT 1;")
        res = cur.fetchone()
        prenombre_id = res[0] if res else None
        
        # Insert Professional
        cur.execute("""
            INSERT INTO profesionales (
                nombre, apellidos, prenombre_id, tipo_identificacion, numero_identificacion,
                correo, celular, ciudad, especialidad_id, estado_cuenta, activo, nombre_completo
            ) VALUES (
                'Juan', 'Perez', %s, 'CC', '12345678',
                'juan@example.com', '3001234567', 'Bogotá', %s, 'Habilitada', true, 'Dr. Juan Perez'
            ) ON CONFLICT DO NOTHING;
        """, (prenombre_id, med_id))

        conn.commit()
        print("Seeding Complete.")
        conn.close()
        
    except Exception as e:
        print(f"Database error: {e}")

if __name__ == "__main__":
    seed_data()
