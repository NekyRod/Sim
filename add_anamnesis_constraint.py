
import psycopg2

def add_constraint():
    conn_str = "host=localhost port=5432 dbname=goi user=postgres password=postgres"
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        # Add UNIQUE constraint to paciente_id if not exists
        # In Postgres, we can check pg_constraint
        cur.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE conname = 'idx_unique_paciente_anamnesis'
                ) THEN
                    ALTER TABLE anamnesis ADD CONSTRAINT idx_unique_paciente_anamnesis UNIQUE (paciente_id);
                END IF;
            END $$;
        """)
        
        conn.commit()
        cur.close()
        conn.close()
    except:
        pass

if __name__ == "__main__":
    add_constraint()
