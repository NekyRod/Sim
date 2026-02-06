
from app.database.connection import get_db_connection

def listar_festivos():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("SELECT id, fecha, descripcion FROM festivos ORDER BY fecha")
            rows = cur.fetchall()
            return [{"id": r[0], "fecha": str(r[1]), "descripcion": r[2]} for r in rows]
    finally:
        conn.close()

def crear_festivo(fecha: str, descripcion: str):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute(
                "INSERT INTO festivos (fecha, descripcion) VALUES (%s, %s) RETURNING id",
                (fecha, descripcion)
            )
            nuevo_id = cur.fetchone()[0]
            conn.commit()
            return nuevo_id
    finally:
        conn.close()

def eliminar_festivo(id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("DELETE FROM festivos WHERE id = %s", (id,))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()
