# app/database/ciudadesresidencia_repo.py
from app.database.connection import get_db_connection

def get_all_ciudades():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, nombre, activo 
                FROM ciudades_residencia 
                WHERE activo = TRUE
                ORDER BY nombre
            """)
            rows = cur.fetchall()
            return [{"id": r[0], "nombre": r[1], "activo": r[2]} for r in rows]
    finally:
        conn.close()

def get_ciudad_by_id(ciudad_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("SELECT id, nombre, activo FROM ciudades_residencia WHERE id = %s", (ciudad_id,))
            row = cur.fetchone()
            return {"id": row[0], "nombre": row[1], "activo": row[2]} if row else None
    finally:
        conn.close()

def create_ciudad(data: dict) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO ciudades_residencia (nombre, activo) VALUES (%s, %s) RETURNING id;",
                (data["nombre"], data.get("activo", True))
            )
            return cur.fetchone()[0]
    finally:
        conn.close()

def update_ciudad(ciudad_id: int, data: dict) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "UPDATE ciudades_residencia SET nombre = %s, activo = %s, updated_at = NOW() WHERE id = %s",
                (data["nombre"], data.get("activo", True), ciudad_id)
            )
            return cur.rowcount
    finally:
        conn.close()

def delete_ciudad(ciudad_id: int) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("UPDATE ciudades_residencia SET activo = FALSE, updated_at = NOW() WHERE id = %s", (ciudad_id,))
            return cur.rowcount
    finally:
        conn.close()
