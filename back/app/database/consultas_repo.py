
from typing import List, Dict, Any, Optional
from psycopg2.extras import RealDictCursor
from app.database.connection import get_db_connection

class ConsultasRepo:
    @staticmethod
    def get_by_paciente(paciente_id: int) -> List[Dict[str, Any]]:
        sql = """
            SELECT c.*, p.nombre_completo as profesional_nombre
            FROM consultas_atencion c
            LEFT JOIN profesionales p ON c.profesional_id = p.id
            WHERE c.paciente_id = %s
            ORDER BY c.fecha_consulta DESC
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (paciente_id,))
                return cur.fetchall()

    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        sql = """
            INSERT INTO consultas_atencion (
                paciente_id, profesional_id, motivo, 
                enfermedad_actual, diagnostico_cie10_codigo, 
                diagnostico_cie10_texto, plan_tratamiento, 
                observaciones, registrado_por
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (
                    data['paciente_id'],
                    data.get('profesional_id'),
                    data.get('motivo'),
                    data.get('enfermedad_actual'),
                    data.get('diagnostico_cie10_codigo'),
                    data.get('diagnostico_cie10_texto'),
                    data.get('plan_tratamiento'),
                    data.get('observaciones'),
                    data.get('registrado_por')
                ))
                new_row = cur.fetchone()
                conn.commit()
                return new_row

    @staticmethod
    def delete(consulta_id: int) -> bool:
        sql = "DELETE FROM consultas_atencion WHERE id = %s"
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (consulta_id,))
                conn.commit()
                return cur.rowcount > 0
