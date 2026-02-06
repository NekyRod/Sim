
from app.database.connection import get_db_connection

def listar_rangos_bloqueados(profesional_id: int = None, fecha: str = None):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            query = "SELECT id, profesional_id, fecha, hora_inicio, hora_fin, descripcion FROM rangos_bloqueados WHERE 1=1"
            params = []
            if profesional_id:
                query += " AND profesional_id = %s"
                params.append(profesional_id)
            if fecha:
                query += " AND fecha = %s"
                params.append(fecha)
            
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            return [{
                "id": r[0],
                "profesional_id": r[1],
                "fecha": str(r[2]),
                "hora_inicio": str(r[3]),
                "hora_fin": str(r[4]),
                "descripcion": r[5]
            } for r in rows]
    finally:
        conn.close()

def crear_rango_bloqueado(data: dict):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                """INSERT INTO rangos_bloqueados (profesional_id, fecha, hora_inicio, hora_fin, descripcion) 
                   VALUES (%s, %s, %s, %s, %s) RETURNING id""",
                (data['profesional_id'], data['fecha'], data['hora_inicio'], data['hora_fin'], data.get('descripcion', ''))
            )
            nuevo_id = cur.fetchone()[0]
            conn.commit()
            return nuevo_id
    finally:
        conn.close()

def eliminar_rango_bloqueado(id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("DELETE FROM rangos_bloqueados WHERE id = %s", (id,))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()
