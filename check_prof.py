
import psycopg2
import sys

def check_profesionales():
    conn_str = "host=localhost port=5432 dbname=goi user=postgres password=postgres"
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        print("--- Table: profesionales ---")
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profesionales' AND table_schema = 'public'
        """)
        for row in cur.fetchall():
            print(row)
            
        print("\n--- Testing Timeline Query ---")
        try:
            cur.execute("""
                SELECT h.id::text, h.paciente_id, h.profesional_id, h.fecha_registro, h.estado,
                       h.registrado_por
                FROM odontograma_historial h
                WHERE h.paciente_id = 1 AND h.estado = 'Finalizado'
            """)
            print(f"Basic query ok: {len(cur.fetchall())} rows")
        except Exception as e:
            print(f"Basic query failed: {e}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_profesionales()
