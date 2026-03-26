# app/database/tarifas_repo.py
from app.database.connection import get_db_connection


def get_all_tarifas(solo_activas=True):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            sql = "SELECT id, codigo_cups, descripcion, valor, iva_porcentaje, activo FROM tarifas"
            if solo_activas:
                sql += " WHERE activo = TRUE"
            sql += " ORDER BY codigo_cups"
            cur.execute(sql)
            rows = cur.fetchall()
            return [
                {"id": r[0], "codigo_cups": r[1], "descripcion": r[2],
                 "valor": float(r[3]), "iva_porcentaje": float(r[4]), "activo": r[5]}
                for r in rows
            ]
    finally:
        conn.close()


def get_tarifa_by_id(tarifa_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "SELECT id, codigo_cups, descripcion, valor, iva_porcentaje, activo FROM tarifas WHERE id = %s",
                (tarifa_id,)
            )
            r = cur.fetchone()
            if not r:
                return None
            return {"id": r[0], "codigo_cups": r[1], "descripcion": r[2],
                    "valor": float(r[3]), "iva_porcentaje": float(r[4]), "activo": r[5]}
    finally:
        conn.close()


def get_tarifa_by_cups(codigo_cups: str):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "SELECT id, codigo_cups, descripcion, valor, iva_porcentaje, activo FROM tarifas WHERE codigo_cups = %s",
                (codigo_cups,)
            )
            r = cur.fetchone()
            if not r:
                return None
            return {"id": r[0], "codigo_cups": r[1], "descripcion": r[2],
                    "valor": float(r[3]), "iva_porcentaje": float(r[4]), "activo": r[5]}
    finally:
        conn.close()


def create_tarifa(data: dict) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                """INSERT INTO tarifas (codigo_cups, descripcion, valor, iva_porcentaje, activo)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id;""",
                (data["codigo_cups"], data["descripcion"],
                 data.get("valor", 0), data.get("iva_porcentaje", 0), data.get("activo", True))
            )
            return cur.fetchone()[0]
    finally:
        conn.close()


def update_tarifa(tarifa_id: int, data: dict) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                """UPDATE tarifas
                   SET codigo_cups = %s, descripcion = %s, valor = %s,
                       iva_porcentaje = %s, activo = %s, updated_at = NOW()
                   WHERE id = %s""",
                (data["codigo_cups"], data["descripcion"],
                 data.get("valor", 0), data.get("iva_porcentaje", 0),
                 data.get("activo", True), tarifa_id)
            )
            return cur.rowcount
    finally:
        conn.close()


def delete_tarifa(tarifa_id: int) -> int:
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "UPDATE tarifas SET activo = FALSE, updated_at = NOW() WHERE id = %s",
                (tarifa_id,)
            )
            return cur.rowcount
    finally:
        conn.close()
