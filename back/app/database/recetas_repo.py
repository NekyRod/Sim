
import json
from typing import List, Dict, Any, Optional
from psycopg2.extras import RealDictCursor
from app.database.connection import get_db_connection

class RecetasRepo:
    @staticmethod
    def get_by_paciente(paciente_id: int) -> List[Dict[str, Any]]:
        sql = """
            SELECT r.*, p.nombre_completo as profesional_nombre
            FROM recetas r
            LEFT JOIN profesionales p ON r.profesional_id = p.id
            WHERE r.paciente_id = %s
            ORDER BY r.fecha_receta DESC
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (paciente_id,))
                return cur.fetchall()

    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        sql = """
            INSERT INTO recetas (paciente_id, profesional_id, medicamentos, indicaciones_generales, registrado_por)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (
                    data['paciente_id'],
                    data.get('profesional_id'),
                    json.dumps(data.get('medicamentos', [])),
                    data.get('indicaciones_generales'),
                    data.get('registrado_por')
                ))
                new_row = cur.fetchone()
                conn.commit()
                return new_row

    @staticmethod
    def delete(receta_id: int) -> bool:
        sql = "DELETE FROM recetas WHERE id = %s"
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (receta_id,))
                conn.commit()
                return cur.rowcount > 0
