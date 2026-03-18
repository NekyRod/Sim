
import psycopg2
import traceback

def diagnostic():
    conn_str = "host=localhost port=5432 dbname=goi user=postgres password=postgres"
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        paciente_id = 1
        
        print(f"--- Diagnosing Timeline for Patient {paciente_id} ---")
        
        # Step 1: Check h.registrado_por and professional join
        print("\nTesting Query 1 (Historial)...")
        try:
            cur.execute("""
                SELECT h.id::text, h.paciente_id, h.profesional_id, h.fecha_registro, h.observaciones, h.estado,
                       CONCAT(p.nombre, ' ', p.apellidos) as profesional_nombre,
                       h.registrado_por
                FROM odontograma_historial h
                LEFT JOIN profesionales p ON h.profesional_id = p.id
                WHERE h.paciente_id = %s AND h.estado = 'Finalizado'
                ORDER BY h.fecha_registro DESC
            """, (paciente_id,))
            rows = cur.fetchall()
            print(f"Query 1 success. Found {len(rows)} rows.")
            
            for row in rows:
                h_id = row[0]
                print(f"\n  Testing Query 2 (Detalles) for ID: {h_id}...")
                try:
                    cur.execute("""
                        SELECT d.id::text, d.pieza_dental as fdi, d.cara, d.estado_completado, d.evolucion_porcentaje,
                               p.nombre as procedimiento_nombre, p.color_hex, 
                               p.aplica_diente_completo, p.es_extraccion,
                               d.hallazgo, d.plan_tratamiento, d.cie10_codigo, d.cie10_texto
                        FROM detalle_diente d
                        JOIN procedimientos_personalizados p ON d.procedimiento_id = p.id
                        WHERE d.odontograma_id = %s
                    """, (h_id,))
                    detalles = cur.fetchall()
                    print(f"  Query 2 success. Found {len(detalles)} details.")
                except Exception as de:
                    print(f"  Query 2 FAILED: {de}")
                    traceback.print_exc()
                    
        except Exception as he:
            print(f"Query 1 FAILED: {he}")
            traceback.print_exc()

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Connection FAILED: {e}")

if __name__ == "__main__":
    diagnostic()
