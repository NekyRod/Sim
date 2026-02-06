# app/database/tiposservicio_repo.py
from app.database.connection import get_db_connection

def get_all_tipos_servicio():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("SELECT id, codigo, nombre, activo FROM tipos_servicio WHERE activo = TRUE ORDER BY nombre")
            rows = cur.fetchall()
            return [{"id": r[0], "codigo": r[1], "nombre": r[2], "activo": r[3]} for r in rows]
    finally:
        conn.close()

def get_tipo_servicio_by_id(tipo_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("SELECT id, codigo, nombre, activo FROM tipos_servicio WHERE id = %s", (tipo_id,))
            row = cur.fetchone()
            return {"id": row[0], "codigo": row[1], "nombre": row[2], "activo": row[3]} if row else None
    finally:
        conn.close()

def create_tipo_servicio(data: dict) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO tipos_servicio (codigo, nombre, activo) VALUES (%s, %s, %s) RETURNING id;",
                (data["codigo"], data["nombre"], data.get("activo", True))
            )
            return cur.fetchone()[0]
    finally:
        conn.close()

def update_tipo_servicio(tipo_id: int, data: dict) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "UPDATE tipos_servicio SET codigo = %s, nombre = %s, activo = %s, updated_at = NOW() WHERE id = %s",
                (data["codigo"], data["nombre"], data.get("activo", True), tipo_id)
            )
            return cur.rowcount
    finally:
        conn.close()

def delete_tipo_servicio(tipo_id: int) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("UPDATE tipos_servicio SET activo = FALSE, updated_at = NOW() WHERE id = %s", (tipo_id,))
            return cur.rowcount
    finally:
        conn.close()
