# app/database/citas_repo.py

from datetime import date, time
from app.database.connection import get_db_connection

def existe_cita(
    paciente_id: int, # Aunque no lo usemos para superposición, lo mantenemos si queremos filtrar por paciente también, pero la lógica actual no lo usa.
    profesional_id: int,
    fecha_programacion: date,
    fecha_solicitada: date,
    hora_inicio: time,
    hora_fin: time = None # Hacemos opcional para no romper otros calls si los hay
):
    """
    Verificar si ya existe una cita que se superponga en el rango de tiempo.
    Retorna la fila si existe superposición, None si no.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            # Condición de superposición: (StartA < EndB) AND (EndA > StartB)
            # Aquí: (c.hora < hora_fin) AND (c.hora_fin > hora_inicio)
            # Asumimos que la tabla tiene hora_fin. Si no, usaremos lógica aproximada o fallará.
            cur.execute(
                """
                SELECT id, fecha_programacion, hora, hora_fin
                FROM citas
                WHERE profesional_id = %s
                  AND fecha_programacion = %s
                  AND activo = TRUE
                  AND estado != 'CANCELADA'
                  AND (hora < %s AND hora_fin > %s)
                """,
                (profesional_id, fecha_programacion, hora_fin, hora_inicio),
            )
            return cur.fetchone()
    finally:
        conn.close()

def get_citas_profesional_rango(profesional_id: int, fecha_inicio: date, fecha_fin: date):
    """
    Obtener citas de uno o todos los profesionales en un rango de fechas.
    Si profesional_id es 0, se obtienen citas de todos los profesionales.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            sql = """
                SELECT 
                    c.fecha_programacion,
                    c.hora,
                    e.nombre as motivo_nombre,
                    c.id,
                    c.hora_fin,
                    p.nombre_completo as paciente_nombre,
                    p.numero_identificacion as paciente_documento,
                    p.telefono_celular as paciente_telefono,
                    TRIM(CONCAT(COALESCE(pr.nombre, ''), ' ', prof.nombre, ' ', prof.apellidos)) as profesional_nombre,
                    p.telefono_fijo,
                    p.segundo_telefono_celular,
                    p.titular_segundo_celular,
                    p.nombre_acompanante,
                    c.motivo_cita,
                    c.profesional_id,
                    c.tipo_servicio
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                LEFT JOIN especialidades e ON c.motivo_cita = e.codigo
                JOIN profesionales prof ON c.profesional_id = prof.id
                LEFT JOIN prenombres pr ON prof.prenombre_id = pr.id
                WHERE c.fecha_programacion BETWEEN %s AND %s
                  AND c.activo = TRUE
                  AND c.estado != 'CANCELADA'
            """
            params = [fecha_inicio, fecha_fin]
            
            if profesional_id and profesional_id > 0:
                sql += " AND c.profesional_id = %s"
                params.append(profesional_id)
            
            sql += " ORDER BY c.fecha_programacion, c.hora"
            
            cur.execute(sql, tuple(params))
            rows = cur.fetchall()
            return [
                {
                    "fecha": str(r[0]),
                    "hora": str(r[1]),
                    "motivo": r[2] if r[2] else "N/A",
                    "id": r[3],
                    "hora_fin": str(r[4]) if r[4] else None,
                    "paciente": r[5],
                    "documento": r[6],
                    "telefono": r[7],
                    "profesional": r[8],
                    "telefono_fijo": r[9],
                    "segundo_telefono_celular": r[10],
                    "titular_segundo_celular": r[11],
                    "nombre_acompanante": r[12],
                    "motivo_codigo": r[13],
                    "profesional_id": r[14],
                    "tipo_servicio": r[15]
                }
                for r in rows
            ]
    finally:
        conn.close()

def insertar_cita(data: dict) -> int:
    """
    Insertar una nueva cita en la base de datos.
    Retorna el ID de la cita creada.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO citas (
                    paciente_id, profesional_id, fecha_programacion,
                    fecha_solicitada, hora, hora_fin, tipo_servicio, tipo_pbs,
                    mas_6_meses, motivo_cita, observacion, activo
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
                """,
                (
                    data["paciente_id"],
                    data["profesional_id"],
                    data["fecha_programacion"],
                    data["fecha_solicitada"],
                    data["hora"],
                    data.get("hora_fin"), # Nuevo campo
                    data["tipo_servicio"],
                    data.get("tipo_pbs"),
                    data["mas_6_meses"],
                    data.get("motivo_cita"),
                    data.get("observacion"),
                    True  # activo por defecto
                ),
            )
            return cur.fetchone()[0]
    finally:
        conn.close()

def get_all_citas():
    """
    Obtener todas las citas activas con información del paciente y profesional.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    c.id,
                    c.paciente_id,
                    p.nombre_completo AS nombre_paciente,
                    p.numero_identificacion,
                    c.profesional_id,
                    c.fecha_programacion,
                    c.fecha_solicitada,
                    c.hora,
                    c.tipo_servicio,
                    c.tipo_pbs,
                    c.mas_6_meses,
                    c.motivo_cita,
                    c.observacion,
                    c.estado,
                    c.created_at
                FROM citas c
                INNER JOIN pacientes p ON c.paciente_id = p.id
                WHERE c.activo = TRUE
                ORDER BY c.fecha_programacion DESC, c.hora DESC
            """)
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "paciente_id": r[1],
                    "nombre_paciente": r[2],
                    "numero_identificacion": r[3],
                    "profesional_id": r[4],
                    "fecha_programacion": str(r[5]) if r[5] else None,
                    "fecha_solicitada": str(r[6]) if r[6] else None,
                    "hora": str(r[7]) if r[7] else None,
                    "tipo_servicio": r[8],
                    "tipo_pbs": r[9],
                    "mas_6_meses": r[10],
                    "motivo_cita": r[11],
                    "observacion": r[12],
                    "estado": r[13],
                    "created_at": str(r[14]) if r[14] else None
                }
                for r in rows
            ]
    finally:
        conn.close()

def get_cita_by_id(cita_id: int):
    """
    Obtener una cita específica por su ID.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    c.id,
                    c.paciente_id,
                    p.nombre_completo AS nombre_paciente,
                    p.numero_identificacion,
                    c.profesional_id,
                    c.fecha_programacion,
                    c.fecha_solicitada,
                    c.hora,
                    c.tipo_servicio,
                    c.tipo_pbs,
                    c.mas_6_meses,
                    c.motivo_cita,
                    c.observacion,
                    c.estado,
                    c.activo,
                    c.hora_fin,
                    p.tipo_identificacion,
                    p.telefono_fijo,
                    p.telefono_celular,
                    p.segundo_telefono_celular,
                    p.titular_segundo_celular,
                    p.direccion,
                    p.correo_electronico,
                    p.lugar_residencia,
                    p.fecha_nacimiento,
                    p.tipo_doc_acompanante,
                    p.nombre_acompanante,
                    p.parentesco_acompanante
                FROM citas c
                INNER JOIN pacientes p ON c.paciente_id = p.id
                WHERE c.id = %s
            """, (cita_id,))
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "paciente_id": row[1],
                "nombre_paciente": row[2],
                "numero_identificacion": row[3],
                "profesional_id": row[4],
                "fecha_programacion": str(row[5]) if row[5] else None,
                "fecha_solicitada": str(row[6]) if row[6] else None,
                "hora": str(row[7]) if row[7] else None,
                "tipo_servicio": row[8],
                "tipo_pbs": row[9],
                "mas_6_meses": row[10],
                "motivo_cita": row[11],
                "observacion": row[12],
                "estado": row[13],
                "activo": row[14],
                "hora_fin": str(row[15]) if row[15] else None,
                "tipo_identificacion": row[16],
                "telefono_fijo": row[17],
                "telefono_celular": row[18],
                "segundo_telefono_celular": row[19],
                "titular_segundo_celular": row[20],
                "direccion": row[21],
                "correo_electronico": row[22],
                "lugar_residencia": row[23],
                "fecha_nacimiento": str(row[24]) if row[24] else None,
                "tipo_doc_acompanante": row[25],
                "nombre_acompanante": row[26],
                "parentesco_acompanante": row[27]
            }
    finally:
        conn.close()

def update_cita_estado(cita_id: int, nuevo_estado: str) -> int:
    """
    Actualizar el estado de una cita.
    Estados posibles: 'PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', etc.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE citas
                SET estado = %s, updated_at = NOW()
                WHERE id = %s
            """, (nuevo_estado, cita_id))
            return cur.rowcount
    finally:
        conn.close()

def delete_cita(cita_id: int) -> int:
    """
    Eliminar una cita (soft delete).
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE citas
                SET activo = FALSE, updated_at = NOW()
                WHERE id = %s
            """, (cita_id,))
            return cur.rowcount
    finally:
        conn.close()
