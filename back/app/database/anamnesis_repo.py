
from app.database.connection import get_db_connection
import json

def get_anamnesis_by_paciente(paciente_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, paciente_id, antece_medicos, observaciones, 
                       motivo_consulta, escala_dolor, cie10_codigo, cie10_texto,
                       created_at, updated_at, registrado_por
                FROM anamnesis
                WHERE paciente_id = %s
            """, (paciente_id,))
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "paciente_id": row[1],
                "antece_medicos": row[2],
                "observaciones": row[3],
                "motivo_consulta": row[4],
                "escala_dolor": row[5],
                "cie10_codigo": row[6],
                "cie10_texto": row[7],
                "created_at": str(row[8]),
                "updated_at": str(row[9]),
                "registrado_por": row[10]
            }
    finally:
        conn.close()

def upsert_anamnesis(paciente_id: int, antece_medicos: dict, observaciones: str, 
                     motivo_consulta: str = None, escala_dolor: int = None, 
                     cie10_codigo: str = None, cie10_texto: str = None,
                     registrado_por: str = None):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO anamnesis (
                    paciente_id, antece_medicos, observaciones, 
                    motivo_consulta, escala_dolor, cie10_codigo, cie10_texto,
                    registrado_por, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (paciente_id) 
                DO UPDATE SET 
                    antece_medicos = EXCLUDED.antece_medicos,
                    observaciones = EXCLUDED.observaciones,
                    motivo_consulta = EXCLUDED.motivo_consulta,
                    escala_dolor = EXCLUDED.escala_dolor,
                    cie10_codigo = EXCLUDED.cie10_codigo,
                    cie10_texto = EXCLUDED.cie10_texto,
                    registrado_por = EXCLUDED.registrado_por,
                    updated_at = NOW()
                RETURNING id;
            """, (paciente_id, json.dumps(antece_medicos), observaciones, 
                  motivo_consulta, escala_dolor, cie10_codigo, cie10_texto,
                  registrado_por))
            return cur.fetchone()[0]
    finally:
        conn.close()
