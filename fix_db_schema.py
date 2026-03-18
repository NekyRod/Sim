
import psycopg2

def apply_fix():
    conn_str = "host=localhost port=5432 dbname=goi user=postgres password=postgres"
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        cur.execute("ALTER TABLE odontograma_historial ADD COLUMN IF NOT EXISTS registrado_por VARCHAR(100);")
        cur.execute("ALTER TABLE odontograma_historial ALTER COLUMN profesional_id DROP NOT NULL;")
        
        cur.execute("ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS hallazgo TEXT;")
        cur.execute("ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS plan_tratamiento TEXT;")
        cur.execute("ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS cie10_codigo VARCHAR(20);")
        cur.execute("ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS cie10_texto TEXT;")
        cur.execute("ALTER TABLE detalle_diente ADD COLUMN IF NOT EXISTS evolucion_porcentaje INTEGER DEFAULT 100;")

        cur.execute("ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS motivo_consulta TEXT;")
        cur.execute("ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS escala_dolor INTEGER DEFAULT 0;")
        cur.execute("ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS cie10_codigo VARCHAR(20);")
        cur.execute("ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS cie10_texto TEXT;")
        cur.execute("ALTER TABLE anamnesis ADD COLUMN IF NOT EXISTS registrado_por VARCHAR(100);")

        conn.commit()
        cur.close()
        conn.close()
    except:
        pass

if __name__ == "__main__":
    apply_fix()
