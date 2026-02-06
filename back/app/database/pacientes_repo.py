# app/database/pacientes_repo.py

from app.database.connection import get_db_connection

def get_all_pacientes():
    """Obtener todos los pacientes activos"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, tipo_identificacion, numero_identificacion, nombre_completo,
                       telefono_fijo, telefono_celular, segundo_telefono_celular, 
                       titular_segundo_celular, direccion, correo_electronico,
                       lugar_residencia, fecha_nacimiento, 
                       tipo_doc_acompanante, nombre_acompanante, parentesco_acompanante,
                       activo
                FROM pacientes
                WHERE activo = TRUE
                ORDER BY nombre_completo
            """)
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "tipo_identificacion": r[1],
                    "numero_identificacion": r[2],
                    "nombre_completo": r[3],
                    "telefono_fijo": r[4],
                    "telefono_celular": r[5],
                    "segundo_telefono_celular": r[6],
                    "titular_segundo_celular": r[7],
                    "direccion": r[8],
                    "correo_electronico": r[9],
                    "lugar_residencia": r[10],
                    "fecha_nacimiento": str(r[11]) if r[11] else None,
                    "tipo_doc_acompanante": r[12],
                    "nombre_acompanante": r[13],
                    "parentesco_acompanante": r[14],
                    "activo": r[15]
                }
                for r in rows
            ]
    finally:
        conn.close()

def get_paciente_by_id(paciente_id: int):
    """Obtener paciente por ID"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT id, tipo_identificacion, numero_identificacion, nombre_completo,
                       telefono_fijo, telefono_celular, segundo_telefono_celular,
                       titular_segundo_celular, direccion, correo_electronico,
                       lugar_residencia, fecha_nacimiento,
                       tipo_doc_acompanante, nombre_acompanante, parentesco_acompanante,
                       activo
                FROM pacientes
                WHERE id = %s
            """, (paciente_id,))
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "tipo_identificacion": row[1],
                "numero_identificacion": row[2],
                "nombre_completo": row[3],
                "telefono_fijo": row[4],
                "telefono_celular": row[5],
                "segundo_telefono_celular": row[6],
                "titular_segundo_celular": row[7],
                "direccion": row[8],
                "correo_electronico": row[9],
                "lugar_residencia": row[10],
                "fecha_nacimiento": str(row[11]) if row[11] else None,
                "tipo_doc_acompanante": row[12],
                "nombre_acompanante": row[13],
                "parentesco_acompanante": row[14],
                "activo": row[15]
            }
    finally:
        conn.close()

def obtener_paciente_por_doc(tipo_id: str, numero_id: str):
    """
    Obtener paciente por tipo y número de documento.
    Retorna una tupla con todos los campos (incluyendo los nuevos del acompañante).
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    id, tipo_identificacion, numero_identificacion, nombre_completo,
                    telefono_fijo, telefono_celular, segundo_telefono_celular,
                    titular_segundo_celular, direccion, correo_electronico,
                    lugar_residencia, fecha_nacimiento,
                    tipo_doc_acompanante, nombre_acompanante, parentesco_acompanante
                FROM pacientes
                WHERE tipo_identificacion = %s 
                  AND numero_identificacion = %s 
                  AND activo = TRUE
            """, (tipo_id, numero_id))
            return cur.fetchone()
    finally:
        conn.close()


def create_paciente(data: dict) -> int:
    """Crear nuevo paciente"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO pacientes (
                    tipo_identificacion, numero_identificacion, nombre_completo,
                    telefono_fijo, telefono_celular, segundo_telefono_celular,
                    titular_segundo_celular, direccion, correo_electronico,
                    lugar_residencia, fecha_nacimiento,
                    tipo_doc_acompanante, nombre_acompanante, parentesco_acompanante,
                    activo
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id;
            """, (
                data["tipo_identificacion"],
                data["numero_identificacion"],
                data["nombre_completo"],
                data.get("telefono_fijo"),
                data.get("telefono_celular"),
                data.get("segundo_telefono_celular"),
                data.get("titular_segundo_celular"),
                data.get("direccion"),
                data.get("correo_electronico"),
                data.get("lugar_residencia"),
                data.get("fecha_nacimiento"),
                data.get("tipo_doc_acompanante"),
                data.get("nombre_acompanante"),
                data.get("parentesco_acompanante"),
                data.get("activo", True)
            ))
            return cur.fetchone()[0]
    finally:
        conn.close()

def update_paciente(paciente_id: int, data: dict) -> int:
    """Actualizar paciente existente"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE pacientes
                SET tipo_identificacion = %s,
                    numero_identificacion = %s,
                    nombre_completo = %s,
                    telefono_fijo = %s,
                    telefono_celular = %s,
                    segundo_telefono_celular = %s,
                    titular_segundo_celular = %s,
                    direccion = %s,
                    correo_electronico = %s,
                    lugar_residencia = %s,
                    fecha_nacimiento = %s,
                    tipo_doc_acompanante = %s,
                    nombre_acompanante = %s,
                    parentesco_acompanante = %s,
                    updated_at = NOW()
                WHERE id = %s
            """, (
                data["tipo_identificacion"],
                data["numero_identificacion"],
                data["nombre_completo"],
                data.get("telefono_fijo"),
                data.get("telefono_celular"),
                data.get("segundo_telefono_celular"),
                data.get("titular_segundo_celular"),
                data.get("direccion"),
                data.get("correo_electronico"),
                data.get("lugar_residencia"),
                data.get("fecha_nacimiento"),
                data.get("tipo_doc_acompanante"),
                data.get("nombre_acompanante"),
                data.get("parentesco_acompanante"),
                paciente_id
            ))
            return cur.rowcount
    finally:
        conn.close()

def delete_paciente(paciente_id: int) -> int:
    """Eliminar paciente (soft delete)"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE pacientes
                SET activo = FALSE, updated_at = NOW()
                WHERE id = %s
            """, (paciente_id,))
            return cur.rowcount
    finally:
        conn.close()

def insertar_paciente(data: dict) -> int:
    """Insertar paciente desde cita (compatibilidad)"""
    return create_paciente({
        "tipo_identificacion": data["tipo_identificacion"],
        "numero_identificacion": data["numero_identificacion"],
        "nombre_completo": data.get("nombre_paciente", data.get("nombre_completo")),
        "telefono_fijo": data.get("telefono_fijo"),
        "telefono_celular": data.get("telefono_celular"),
        "segundo_telefono_celular": data.get("segundo_telefono_celular"),
        "titular_segundo_celular": data.get("titular_segundo_celular"),
        "direccion": data.get("direccion"),
        "correo_electronico": data.get("correo_electronico"),
        "lugar_residencia": data.get("lugar_residencia"),
        "fecha_nacimiento": data.get("fecha_nacimiento"),
        "tipo_doc_acompanante": data.get("tipo_doc_acompanante"),
        "nombre_acompanante": data.get("nombre_acompanante"),
        "parentesco_acompanante": data.get("parentesco_acompanante"),
        "activo": True
    })

def actualizar_paciente(paciente_id: int, data: dict):
    """Actualizar paciente desde cita (compatibilidad)"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE pacientes
                SET telefono_fijo = %s,
                    telefono_celular = %s,
                    segundo_telefono_celular = %s,
                    titular_segundo_celular = %s,
                    direccion = %s,
                    correo_electronico = %s,
                    lugar_residencia = %s,
                    fecha_nacimiento = %s,
                    updated_at = NOW()
                WHERE id = %s;
            """, (
                data.get("telefono_fijo"),
                data.get("telefono_celular"),
                data.get("segundo_telefono_celular"),
                data.get("titular_segundo_celular"),
                data.get("direccion"),
                data.get("correo_electronico"),
                data.get("lugar_residencia"),
                data.get("fecha_nacimiento"),
                paciente_id
            ))
    finally:
        conn.close()
# Agregar esta función en pacientes_repo.py

def buscar_pacientes(termino: str):
    """
    Buscar pacientes por nombre o número de identificación
    """
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    id, tipo_identificacion, numero_identificacion, nombre_completo,
                    telefono_fijo, telefono_celular, segundo_telefono_celular,
                    titular_segundo_celular, direccion, correo_electronico,
                    lugar_residencia, fecha_nacimiento, tipo_doc_acompanante,
                    nombre_acompanante, parentesco_acompanante
                FROM pacientes
                WHERE activo = TRUE
                  AND (
                    LOWER(nombre_completo) LIKE LOWER(%s)
                    OR numero_identificacion LIKE %s
                  )
                ORDER BY nombre_completo
                LIMIT 10
            """, (f'%{termino}%', f'%{termino}%'))
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "tipo_identificacion": r[1],
                    "numero_identificacion": r[2],
                    "nombre_completo": r[3],
                    "telefono_fijo": r[4],
                    "telefono_celular": r[5],
                    "segundo_telefono_celular": r[6],
                    "titular_segundo_celular": r[7],
                    "direccion": r[8],
                    "correo_electronico": r[9],
                    "lugar_residencia": r[10],
                    "fecha_nacimiento": str(r[11]) if r[11] else None,
                    "tipo_doc_acompanante": r[12],
                    "nombre_acompanante": r[13],
                    "parentesco_acompanante": r[14]
                }
                for r in rows
            ]
    finally:
        conn.close()
