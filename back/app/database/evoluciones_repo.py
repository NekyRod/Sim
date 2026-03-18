
from typing import List, Dict, Any, Optional
from psycopg2.extras import RealDictCursor
from app.database.connection import get_db_connection

class EvolucionesRepo:
    @staticmethod
    def get_by_paciente(paciente_id: int) -> List[Dict[str, Any]]:
        sql = """
            SELECT e.*, p.nombre_completo as profesional_nombre
            FROM evoluciones e
            LEFT JOIN profesionales p ON e.profesional_id = p.id
            WHERE e.paciente_id = %s
            ORDER BY e.fecha_evolucion DESC
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (paciente_id,))
                return cur.fetchall()

    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        sql = """
            INSERT INTO evoluciones (paciente_id, profesional_id, nota, registrado_por)
            VALUES (%s, %s, %s, %s)
            RETURNING *
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (
                    data['paciente_id'],
                    data.get('profesional_id'),
                    data['nota'],
                    data.get('registrado_por')
                ))
                new_row = cur.fetchone()
                conn.commit()
                return new_row

    @staticmethod
    def delete(evolucion_id: int) -> bool:
        sql = "DELETE FROM evoluciones WHERE id = %s"
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (evolucion_id,))
                conn.commit()
                return cur.rowcount > 0
