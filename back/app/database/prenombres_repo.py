# app/repositories/prenombres_repo.py

from app.database.connection import get_db_connection

def listar_prenombres():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, nombre, activo 
                FROM prenombres 
                WHERE activo = TRUE
                ORDER BY nombre
            """)
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "nombre": r[1],
                    "activo": r[2]
                }
                for r in rows
            ]
    finally:
        conn.close()

def obtener_prenombre(prenombre_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, nombre, activo 
                FROM prenombres 
                WHERE id = %s
            """, (prenombre_id,))
            return cur.fetchone()
    finally:
        conn.close()

def crear_prenombre(data: dict):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO prenombres (nombre, activo)
                VALUES (%s, %s)
                RETURNING id
            """, (data['nombre'], data.get('activo', True)))
            nuevo_id = cur.fetchone()[0]
            conn.commit()
            return nuevo_id
    finally:
        conn.close()

def actualizar_prenombre(prenombre_id: int, data: dict):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE prenombres
                SET nombre = %s, activo = %s
                WHERE id = %s
            """, (data['nombre'], data.get('activo', True), prenombre_id))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()

def eliminar_prenombre(prenombre_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("UPDATE prenombres SET activo = FALSE WHERE id = %s", (prenombre_id,))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()
