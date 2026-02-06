# app/database/tiposidentificacion_repo.py

from app.database.connection import get_db_connection

def get_all_tipos_identificacion():
    """Obtiene todos los tipos de identificación activos"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, codigo, nombre, activo 
                FROM tipos_identificacion 
                WHERE activo = TRUE
                ORDER BY nombre
            """)
            rows = cur.fetchall()
            # Convertir a lista de diccionarios
            return [
                {
                    "id": row[0],
                    "codigo": row[1],
                    "nombre": row[2],
                    "activo": row[3]
                }
                for row in rows
            ]
    finally:
        conn.close()

def get_tipo_identificacion_by_id(tipo_id: int):
    """Obtiene un tipo de identificación por ID"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, codigo, nombre, activo 
                FROM tipos_identificacion 
                WHERE id = %s
            """, (tipo_id,))
            row = cur.fetchone()
            if row:
                return {
                    "id": row[0],
                    "codigo": row[1],
                    "nombre": row[2],
                    "activo": row[3]
                }
            return None
    finally:
        conn.close()

def create_tipo_identificacion(data: dict) -> int:
    """Crea un nuevo tipo de identificación"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO tipos_identificacion (codigo, nombre, activo)
                VALUES (%s, %s, %s)
                RETURNING id;
            """, (
                data["codigo"],
                data["nombre"],
                data.get("activo", True)
            ))
            return cur.fetchone()[0]
    finally:
        conn.close()

def update_tipo_identificacion(tipo_id: int, data: dict) -> int:
    """Actualiza un tipo de identificación"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE tipos_identificacion 
                SET codigo = %s, nombre = %s, activo = %s, updated_at = NOW()
                WHERE id = %s
            """, (
                data["codigo"],
                data["nombre"],
                data.get("activo", True),
                tipo_id
            ))
            return cur.rowcount
    finally:
        conn.close()

def delete_tipo_identificacion(tipo_id: int) -> int:
    """Desactiva un tipo de identificación (soft delete)"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE tipos_identificacion 
                SET activo = FALSE, updated_at = NOW()
                WHERE id = %s
            """, (tipo_id,))
            return cur.rowcount
    finally:
        conn.close()
