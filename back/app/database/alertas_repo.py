# app/database/alertas_repo.py

from app.database.connection import get_db_connection
from datetime import datetime

def crear_alerta(paciente_id: int, tipo: str, texto: str, created_by: int = None) -> int:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO alertas_paciente (paciente_id, tipo, texto, created_by)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (paciente_id, tipo, texto, created_by))
            nuevo_id = cur.fetchone()[0]
            conn.commit()
            return nuevo_id
    finally:
        conn.close()

def get_alertas_activas() -> list:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Join with pacientes to get the name
            cur.execute("""
                SELECT a.id, a.paciente_id, p.nombre_completo as paciente_nombre, 
                       a.tipo, a.texto, a.created_at, a.created_by
                FROM alertas_paciente a
                JOIN pacientes p ON a.paciente_id = p.id
                WHERE a.activa = TRUE
                ORDER BY a.created_at DESC
            """)
            
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]
    finally:
        conn.close()

def get_alertas_por_paciente(paciente_id: int) -> list:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, paciente_id, tipo, texto, activa, created_at, created_by
                FROM alertas_paciente
                WHERE paciente_id = %s
                ORDER BY created_at DESC
            """, (paciente_id,))
            
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]
    finally:
        conn.close()

def desactivar_alerta(alerta_id: int) -> int:
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE alertas_paciente
                SET activa = FALSE
                WHERE id = %s
            """, (alerta_id,))
            conn.commit()
            return cur.rowcount
    finally:
        conn.close()
