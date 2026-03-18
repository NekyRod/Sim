# app/repositories/especialidades_repo.py

from app.database.connection import get_db_connection

def listar_especialidades(solo_activos: bool = False, solo_autogestion: bool = False):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            sql = "SELECT id, codigo, nombre, activo, es_autogestion FROM especialidades"
            where_clauses = []
            if solo_activos:
                where_clauses.append("activo = TRUE")
            if solo_autogestion:
                where_clauses.append("es_autogestion = TRUE")
            
            if where_clauses:
                sql += " WHERE " + " AND ".join(where_clauses)
            
            sql += " ORDER BY nombre"
            cur.execute(sql)
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "codigo": r[1],
                    "nombre": r[2],
                    "activo": r[3],
                    "es_autogestion": r[4]
                }
                for r in rows
            ]
    finally:
        conn.close()

def obtener_especialidad(especialidad_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, codigo, nombre, activo, es_autogestion 
                FROM especialidades 
                WHERE id = %s
            """, (especialidad_id,))
            return cur.fetchone()
    finally:
        conn.close()

def crear_especialidad(data: dict):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO especialidades (codigo, nombre, activo, es_autogestion)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (data['codigo'], data['nombre'], data.get('activo', True), data.get('es_autogestion', False)))
            nuevo_id = cur.fetchone()[0]
            conn.commit()
            return nuevo_id
    finally:
        conn.close()

def actualizar_especialidad(especialidad_id: int, data: dict):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE especialidades
                SET codigo = %s, nombre = %s, activo = %s, es_autogestion = %s
                WHERE id = %s
            """, (data['codigo'], data['nombre'], data.get('activo', True), data.get('es_autogestion', False), especialidad_id))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()

def eliminar_especialidad(especialidad_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("UPDATE especialidades SET activo = FALSE WHERE id = %s", (especialidad_id,))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()
