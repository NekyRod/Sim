
from typing import List, Dict, Any, Optional
from psycopg2.extras import RealDictCursor
from app.database.connection import get_db_connection

class DocumentosRepo:
    @staticmethod
    def get_by_paciente(paciente_id: int) -> List[Dict[str, Any]]:
        sql = """
            SELECT d.*, p.nombre_completo as profesional_nombre
            FROM paciente_documentos d
            LEFT JOIN profesionales p ON d.profesional_id = p.id
            WHERE d.paciente_id = %s
            ORDER BY d.fecha_subida DESC
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (paciente_id,))
                return cur.fetchall()

    @staticmethod
    def create(data: Dict[str, Any]) -> Dict[str, Any]:
        sql = """
            INSERT INTO paciente_documentos (
                paciente_id, profesional_id, tipo_documento, 
                nombre_archivo, url_archivo, observaciones, registrado_por
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (
                    data['paciente_id'],
                    data.get('profesional_id'),
                    data.get('tipo_documento'),
                    data['nombre_archivo'],
                    data['url_archivo'],
                    data.get('observaciones'),
                    data.get('registrado_por')
                ))
                new_row = cur.fetchone()
                conn.commit()
                return new_row

    @staticmethod
    def delete(documento_id: int) -> bool:
        sql = "DELETE FROM paciente_documentos WHERE id = %s"
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (documento_id,))
                conn.commit()
                return cur.rowcount > 0
