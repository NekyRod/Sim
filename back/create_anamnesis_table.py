import psycopg2
import sys
import os

# Ensure app module can be found
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

try:
    from app.database.connection import get_db_connection
except ImportError:
    # Fallback if running from root relative path issues
    sys.path.append(os.path.abspath('d:/OneDrive/Desarr/Proyectos/GOI/back'))
    from app.database.connection import get_db_connection

def create_anamnesis_table():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            print("Creating table 'anamnesis' if not exists...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS anamnesis (
                    id SERIAL PRIMARY KEY,
                    paciente_id INTEGER NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
                    antece_medicos JSONB DEFAULT '{}',
                    observaciones TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    CONSTRAINT unique_anamnesis_paciente UNIQUE (paciente_id)
                );
            """)
            
            print("Creating index on paciente_id...")
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_anamnesis_paciente_id ON anamnesis(paciente_id);
            """)
            
            print("Table 'anamnesis' created successfully.")
    except Exception as e:
        print(f"Error creating table: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    create_anamnesis_table()
