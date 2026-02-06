# app/repositories/disponibilidades_repo.py

from app.database.connection import get_db_connection

def listar_disponibilidades():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    d.id, d.profesional_id, p.nombre_completo,
                    d.dia_semana, d.hora_inicio, d.hora_fin, d.activo
                FROM disponibilidades d
                INNER JOIN profesionales p ON d.profesional_id = p.id
                WHERE d.activo = TRUE
                ORDER BY d.profesional_id, d.dia_semana, d.hora_inicio
            """)
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "profesional_id": r[1],
                    "profesional_nombre": r[2],
                    "dia_semana": r[3],
                    "hora_inicio": str(r[4]),
                    "hora_fin": str(r[5]),
                    "activo": r[6]
                }
                for r in rows
            ]
    finally:
        conn.close()

def obtener_disponibilidades_profesional(profesional_id: int):
    """Obtener todas las disponibilidades de un profesional agrupadas por día"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, dia_semana, hora_inicio, hora_fin
                FROM disponibilidades
                WHERE profesional_id = %s AND activo = TRUE
                ORDER BY dia_semana, hora_inicio
            """, (profesional_id,))
            rows = cur.fetchall()
            
            # Agrupar por día de la semana
            disponibilidades_por_dia = {}
            for r in rows:
                dia = r[1]
                if dia not in disponibilidades_por_dia:
                    disponibilidades_por_dia[dia] = []
                disponibilidades_por_dia[dia].append({
                    "id": r[0],
                    "hora_inicio": str(r[2]),
                    "hora_fin": str(r[3])
                })
            
            return disponibilidades_por_dia
    finally:
        conn.close()

def crear_disponibilidad(data: dict):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO disponibilidades 
                (profesional_id, dia_semana, hora_inicio, hora_fin, activo)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (
                data['profesional_id'],
                data['dia_semana'],
                data['hora_inicio'],
                data['hora_fin'],
                data.get('activo', True)
            ))
            nuevo_id = cur.fetchone()[0]
            conn.commit()
            return nuevo_id
    finally:
        conn.close()

def eliminar_disponibilidad(disponibilidad_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("DELETE FROM disponibilidades WHERE id = %s", (disponibilidad_id,))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()

def eliminar_disponibilidades_profesional(profesional_id: int):
    """Eliminar todas las disponibilidades de un profesional"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("DELETE FROM disponibilidades WHERE profesional_id = %s", (profesional_id,))
            conn.commit()
            return cur.rowcount
    finally:
        conn.close()

def crear_disponibilidades_lote(profesional_id: int, disponibilidades: list):
    """Crear múltiples disponibilidades de una vez"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            # Primero eliminar las existentes
            cur.execute("DELETE FROM disponibilidades WHERE profesional_id = %s", (profesional_id,))
            
            # Insertar las nuevas
            for disp in disponibilidades:
                cur.execute("""
                    INSERT INTO disponibilidades 
                    (profesional_id, dia_semana, hora_inicio, hora_fin, activo)
                    VALUES (%s, %s, %s, %s, TRUE)
                """, (profesional_id, disp['dia_semana'], disp['hora_inicio'], disp['hora_fin']))
            
            conn.commit()
            return True
    finally:
        conn.close()
