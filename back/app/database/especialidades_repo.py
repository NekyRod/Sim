# app/repositories/especialidades_repo.py

from app.database.connection import get_db_connection

def listar_especialidades(solo_activos: bool = False):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            sql = "SELECT id, codigo, nombre, activo FROM especialidades"
            if solo_activos:
                sql += " WHERE activo = TRUE"
            sql += " ORDER BY nombre"
            cur.execute(sql)
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "codigo": r[1],
                    "nombre": r[2],
                    "activo": r[3]
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
                SELECT id, codigo, nombre, activo 
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
                INSERT INTO especialidades (codigo, nombre, activo)
                VALUES (%s, %s, %s)
                RETURNING id
            """, (data['codigo'], data['nombre'], data.get('activo', True)))
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
                SET codigo = %s, nombre = %s, activo = %s
                WHERE id = %s
            """, (data['codigo'], data['nombre'], data.get('activo', True), especialidad_id))
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
