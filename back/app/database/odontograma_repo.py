# app/database/odontograma_repo.py

from app.database.connection import get_db_connection

def get_procedimientos():
    """Obtener todos los procedimientos activos."""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, nombre, tipo, aplica_a_cara, aplica_diente_completo, 
                       color_hex, es_extraccion, es_borrador, activo
                FROM procedimientos_personalizados
                WHERE activo = TRUE
                ORDER BY nombre
            """)
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]
    finally:
        conn.close()

def get_timeline_by_paciente(paciente_id: int):
    """
    Obtiene la línea de tiempo oficial (solo registros FINALIZADOS) del paciente.
    Devuelve los historiales con sus detalles agrupados.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            # Primero buscamos los historiales finalizados con el nombre del profesional o el usuario que registró
            cur.execute("""
                SELECT h.id::text, h.paciente_id, h.profesional_id, h.fecha_registro, h.observaciones, h.estado,
                       CONCAT(p.nombre, ' ', p.apellidos) as profesional_nombre,
                       h.registrado_por, h.created_at, h.updated_at
                FROM odontograma_historial h
                LEFT JOIN profesionales p ON h.profesional_id = p.id
                WHERE h.paciente_id = %s AND h.estado = 'Finalizado'
                ORDER BY h.fecha_registro DESC
            """, (paciente_id,))
            historiales_rows = cur.fetchall()
            
            historiales = []
            for h in historiales_rows:
                h_dict = {
                    "id": h[0],
                    "paciente_id": h[1],
                    "profesional_id": h[2],
                    "fecha_registro": str(h[3]) if h[3] else None,
                    "observaciones": h[4],
                    "estado": h[5],
                    "profesional_nombre": h[6] or h[7], # Fallback to registrado_por
                    "registrado_por": h[7],
                    "created_at": str(h[8]) if h[8] else None,
                    "updated_at": str(h[9]) if h[9] else None,
                    "dientes": []
                }
                
                # Buscamos los detalles de este historial
                cur.execute("""
                    SELECT d.id::text, d.pieza_dental as fdi, d.cara, d.estado_completado, d.evolucion_porcentaje,
                           p.nombre as procedimiento_nombre, p.color_hex, 
                           p.aplica_diente_completo, p.es_extraccion,
                           d.hallazgo, d.plan_tratamiento, d.cie10_codigo, d.cie10_texto
                    FROM detalle_diente d
                    JOIN procedimientos_personalizados p ON d.procedimiento_id = p.id
                    WHERE d.odontograma_id = %s
                """, (h_dict["id"],))
                
                det_cols = [desc[0] for desc in cur.description]
                detalles = [dict(zip(det_cols, det)) for det in cur.fetchall()]
                h_dict["dientes"] = detalles
                historiales.append(h_dict)
                
            return historiales
    finally:
        conn.close()

def get_dientes_extraidos_paciente(paciente_id: int):
    """
    Devuelve lista de números de piezas dentales (FDI) que han sido extraídas.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT d.pieza_dental
                FROM detalle_diente d
                JOIN odontograma_historial h ON d.odontograma_id = h.id
                JOIN procedimientos_personalizados p ON d.procedimiento_id = p.id
                WHERE h.paciente_id = %s 
                  AND h.estado = 'Finalizado'
                  AND p.es_extraccion = TRUE
            """, (paciente_id,))
            return [row[0] for row in cur.fetchall()]
    finally:
        conn.close()

def crear_o_obtener_draft(evaluacion_id: str, paciente_id: int, profesional_id: int = None, registrado_por: str = None):
    """
    Crea un draft si no existe o lo obtiene.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id::text, estado FROM odontograma_historial 
                WHERE id = %s AND paciente_id = %s
            """, (evaluacion_id, paciente_id))
            row = cur.fetchone()
            
            if row:
                # Si ya existe, nos aseguramos de actualizar el profesional/usuario si vienen nuevos
                if registrado_por or profesional_id:
                    cur.execute("""
                        UPDATE odontograma_historial 
                        SET profesional_id = COALESCE(%s, profesional_id),
                            registrado_por = COALESCE(%s, registrado_por)
                        WHERE id = %s
                    """, (profesional_id, registrado_por, evaluacion_id))
                    conn.commit()
                return row[0], row[1]
            
            # Crear nuevo draft
            cur.execute("""
                INSERT INTO odontograma_historial (id, paciente_id, profesional_id, registrado_por, estado)
                VALUES (%s, %s, %s, %s, 'Borrador')
                RETURNING id::text, estado
            """, (evaluacion_id, paciente_id, profesional_id, registrado_por))
            conn.commit()
            row = cur.fetchone()
            return row[0], row[1]
    finally:
        conn.close()

def actualizar_draft(evaluacion_id: str, paciente_id: int, profesional_id: int = None, detalles_data: list = None, registrado_por: str = None):
    """
    Borra detalles viejos del Draft y pone los nuevos (Debounce).
    Crea el draft si no existe para ese UUID.
    """
    conn = get_db_connection()
    try:
        # Check o crear el Draft
        h_id, estado = crear_o_obtener_draft(evaluacion_id, paciente_id, profesional_id, registrado_por)
        
        if estado != 'Borrador':
            raise ValueError("Esta evaluación ya fue finalizada y no acepta modificaciones.")

        with conn.cursor() as cur:
            # 0. Actualizar timestamp de modificación en el cabezote
            cur.execute("""
                UPDATE odontograma_historial 
                SET updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
            """, (h_id,))

            # 1. Borrar detalles anteriores
            
            # 2. Bulk insert
            if detalles_data:
                # Armamos la sintaxis del bulk insert con execute_values
                from psycopg2.extras import execute_values
                insert_query = """
                    INSERT INTO detalle_diente (
                        odontograma_id, procedimiento_id, pieza_dental, cara, 
                        estado_completado, evolucion_porcentaje,
                        hallazgo, plan_tratamiento, cie10_codigo, cie10_texto
                    )
                    VALUES %s
                """
                valores = [
                    (
                        h_id, d["procedimiento_id"], d["pieza_dental"], d["cara"], 
                        d["estado_completado"], d.get("evolucion_porcentaje", 100),
                        d.get("hallazgo"), d.get("plan_tratamiento"), 
                        d.get("cie10_codigo"), d.get("cie10_texto")
                    )
                    for d in detalles_data
                ]
                execute_values(cur, insert_query, valores)
            
            conn.commit()
            return True
            
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def finalizar_evaluacion(evaluacion_id: str):
    """
    Pasa de Borrador a Finalizado.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT estado FROM odontograma_historial WHERE id = %s
            """, (evaluacion_id,))
            row = cur.fetchone()
            
            if not row or row[0] != 'Borrador':
                raise ValueError("Draft inválido o ya cerrado.")
            
            # NUEVO: Verificar que al menos tenga un detalle (no guardar vacíos)
            cur.execute("SELECT COUNT(*) FROM detalle_diente WHERE odontograma_id = %s", (evaluacion_id,))
            if cur.fetchone()[0] == 0:
                raise ValueError("No se puede finalizar un odontograma sin tratamientos aplicados.")
                
            cur.execute("""
                UPDATE odontograma_historial 
                SET estado = 'Finalizado', fecha_registro = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id::text
            """, (evaluacion_id,))
            
            updated_id = cur.fetchone()[0]
            conn.commit()
            return updated_id
            
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def eliminar_odontograma(evaluacion_id: str):
    """
    Elimina físicamente un registro del historial y sus detalles.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            # 1. Eliminar detalles
            cur.execute("DELETE FROM detalle_diente WHERE odontograma_id = %s", (evaluacion_id,))
            # 2. Eliminar cabecera
            cur.execute("DELETE FROM odontograma_historial WHERE id = %s", (evaluacion_id,))
            conn.commit()
            return True
    except Exception as e:
        conn.rollback()
        print(f"Error eliminando odontograma {evaluacion_id}: {e}", flush=True)
        raise e
    finally:
        conn.close()
