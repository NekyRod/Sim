# app/database/informes_repo.py

from app.database.connection import get_db_connection
from datetime import date

def get_reporte_oportunidad_repo(anio: int, trimestre: int):
    """
    Obtener datos para el reporte de oportunidad.
    Filtra citas por año y trimestre.
    """
    mes_inicio = (trimestre - 1) * 3 + 1
    mes_fin = mes_inicio + 2
    
    fecha_inicio = f"{anio}-{mes_inicio:02d}-01"
    # Lógica simplificada para fin de mes (asumiendo 31 para simplificar o calculando)
    # En un sistema real usaríamos calendarios más precisos.
    import calendar
    _, last_day = calendar.monthrange(int(anio), mes_fin)
    fecha_fin = f"{anio}-{mes_fin:02d}-{last_day}"

    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    p.tipo_identificacion,
                    p.numero_identificacion,
                    p.nombre_completo as nombre_paciente,
                    p.fecha_nacimiento,
                    c.created_at::date as fecha_asignacion,
                    c.fecha_solicitada as fecha_deseada,
                    c.fecha_programacion as fecha_programada,
                    (c.fecha_programacion - c.fecha_solicitada) as diferencia_dias,
                    p.genero
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                WHERE c.fecha_programacion BETWEEN %s AND %s
                  AND c.activo = TRUE
                ORDER BY c.fecha_programacion ASC
            """, (fecha_inicio, fecha_fin))
            rows = cur.fetchall()
            return [
                {
                    "tipo_identificacion": r[0],
                    "numero_identificacion": r[1],
                    "nombre_paciente": r[2],
                    "fecha_nacimiento": str(r[3]) if r[3] else None,
                    "fecha_asignacion": str(r[4]) if r[4] else None,
                    "fecha_deseada": str(r[5]) if r[5] else None,
                    "fecha_programada": str(r[6]) if r[6] else None,
                    "diferencia_dias": r[7],
                    "genero": r[8]
                }
                for r in rows
            ]
    finally:
        conn.close()

def get_reporte_cancelaciones_repo(fecha_inicio: date, fecha_fin: date):
    """
    Obtener datos para el reporte de cancelaciones en un rango de fechas.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    c.id,
                    c.fecha_programacion,
                    c.hora,
                    p.nombre_completo as nombre_paciente,
                    p.numero_identificacion,
                    TRIM(CONCAT(prof.nombre, ' ', prof.apellidos)) as profesional_nombre,
                    c.cancelado_motivo,
                    c.cancelado_por_nombre,
                    c.fecha_cancelacion
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                JOIN profesionales prof ON c.profesional_id = prof.id
                WHERE c.estado = 'CANCELADA'
                  AND c.fecha_cancelacion::date BETWEEN %s AND %s
                ORDER BY c.fecha_cancelacion DESC
            """, (fecha_inicio, fecha_fin))
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "fecha_programada": str(r[1]),
                    "hora": str(r[2]),
                    "paciente": r[3],
                    "documento": r[4],
                    "profesional": r[5],
                    "motivo": r[6],
                    "cancelado_por": r[7],
                    "fecha_cancelacion": str(r[8]) if r[8] else None
                }
                for r in rows
            ]
    finally:
        conn.close()

def get_reporte_listado_repo(fecha_inicio: date, fecha_fin: date):
    """
    Obtener listado general de citas (activas y completadas) para reporte.
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    c.fecha_programacion,
                    c.hora,
                    p.nombre_completo as nombre_paciente,
                    p.numero_identificacion,
                    TRIM(CONCAT(prof.nombre, ' ', prof.apellidos)) as profesional_nombre,
                    COALESCE(e.nombre, 'General') as motivo_nombre,
                    c.estado,
                    c.tipo_servicio,
                    c.hora_fin
                FROM citas c
                JOIN pacientes p ON c.paciente_id = p.id
                JOIN profesionales prof ON c.profesional_id = prof.id
                LEFT JOIN especialidades e ON c.motivo_cita = e.codigo
                WHERE c.activo = TRUE
                  AND c.fecha_programacion BETWEEN %s AND %s
                ORDER BY c.fecha_programacion ASC, c.hora ASC
            """, (fecha_inicio, fecha_fin))
            rows = cur.fetchall()
            return [
                {
                    "fecha": str(r[0]),
                    "hora": str(r[1]),
                    "paciente": r[2],
                    "documento": r[3],
                    "profesional": r[4],
                    "motivo": r[5],
                    "estado": r[6],
                    "tipo_servicio": r[7],
                    "hora_fin": str(r[8]) if r[8] else None
                }
                for r in rows
            ]
    finally:
        conn.close()
