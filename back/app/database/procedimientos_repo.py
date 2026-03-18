# app/database/procedimientos_repo.py

from app.database.connection import get_db_connection

def get_todos_procedimientos():
    """Obtiene todos los procedimientos, incluyendo los inactivos (para el panel admin)"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, nombre, tipo, aplica_a_cara, aplica_diente_completo, 
                       color_hex, es_extraccion, es_borrador, activo
                FROM procedimientos_personalizados
                ORDER BY nombre
            """)
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]
    finally:
        conn.close()

def crear_procedimiento(procedimiento_data: dict):
    """Inserta un nuevo procedimiento en la BD"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO procedimientos_personalizados 
                (nombre, tipo, aplica_a_cara, aplica_diente_completo, color_hex, es_extraccion, es_borrador, activo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                procedimiento_data.get('nombre'),
                procedimiento_data.get('tipo', 'Hallazgo'),
                procedimiento_data.get('aplica_a_cara', True),
                procedimiento_data.get('aplica_diente_completo', False),
                procedimiento_data.get('color_hex', '#000000'),
                procedimiento_data.get('es_extraccion', False),
                procedimiento_data.get('es_borrador', False),
                procedimiento_data.get('activo', True)
            ))
            new_id = cur.fetchone()[0]
            conn.commit()
            return new_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def actualizar_procedimiento(proc_id: int, procedimiento_data: dict):
    """Actualiza un procedimiento existente"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE procedimientos_personalizados 
                SET nombre = %s, tipo = %s, aplica_a_cara = %s, aplica_diente_completo = %s, 
                    color_hex = %s, es_extraccion = %s, es_borrador = %s, activo = %s
                WHERE id = %s
                RETURNING id
            """, (
                procedimiento_data.get('nombre'),
                procedimiento_data.get('tipo'),
                procedimiento_data.get('aplica_a_cara'),
                procedimiento_data.get('aplica_diente_completo'),
                procedimiento_data.get('color_hex'),
                procedimiento_data.get('es_extraccion'),
                procedimiento_data.get('es_borrador'),
                procedimiento_data.get('activo'),
                proc_id
            ))
            updated_id = cur.fetchone()
            if not updated_id:
                raise ValueError("Procedimiento no encontrado")
            conn.commit()
            return updated_id[0]
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def eliminar_procedimiento(proc_id: int):
    """Elimina físicamente un procedimiento si no ha sido usado, o lanza un error"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            # Primero validamos si está siendo usado en algún odontograma histórico
            cur.execute("SELECT COUNT(*) FROM detalle_diente WHERE procedimiento_id = %s", (proc_id,))
            usos = cur.fetchone()[0]
            
            if usos > 0:
                # Soft delete
                cur.execute("UPDATE procedimientos_personalizados SET activo = FALSE WHERE id = %s RETURNING id", (proc_id,))
                res = cur.fetchone()
                if not res:
                     raise ValueError("Procedimiento no encontrado")
                conn.commit()
                return {"mensaje": "El procedimiento está en uso clínico. Se ha desactivado (Soft Delete) en lugar de eliminarse."}
            else:
                # Hard delete
                cur.execute("DELETE FROM procedimientos_personalizados WHERE id = %s RETURNING id", (proc_id,))
                res = cur.fetchone()
                if not res:
                     raise ValueError("Procedimiento no encontrado")
                conn.commit()
                return {"mensaje": "Procedimiento eliminado físicamente con éxito."}
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()
