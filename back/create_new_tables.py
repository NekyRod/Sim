
import psycopg2
from app.database.connection import get_db_connection

def main():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Crear tabla festivos
        cur.execute("""
            CREATE TABLE IF NOT EXISTS festivos (
                id SERIAL PRIMARY KEY,
                fecha DATE NOT NULL UNIQUE,
                descripcion VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Crear tabla rangos_bloqueados sin FK explicita si falla
        try:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rangos_bloqueados (
                    id SERIAL PRIMARY KEY,
                    profesional_id INTEGER NOT NULL REFERENCES profesionales(id),
                    fecha DATE NOT NULL,
                    hora_inicio TIME NOT NULL,
                    hora_fin TIME NOT NULL,
                    descripcion VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        except Exception as e:
            conn.rollback()
            cur = conn.cursor()
            print(f"Error con FK, creando sin FK: {e}")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rangos_bloqueados (
                    id SERIAL PRIMARY KEY,
                    profesional_id INTEGER NOT NULL,
                    fecha DATE NOT NULL,
                    hora_inicio TIME NOT NULL,
                    hora_fin TIME NOT NULL,
                    descripcion VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
        
        conn.commit()
        print("Tablas creadas con éxito.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error fatal: {e}")

if __name__ == "__main__":
    main()
