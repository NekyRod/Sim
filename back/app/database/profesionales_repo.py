# app/repositories/profesionales_repo.py

from app.database.connection import get_db_connection

def listar_profesionales():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT ON (p.id)
                    p.id, p.nombre, p.apellidos, p.prenombre_id, pr.nombre as prenombre,
                    p.tipo_identificacion, p.numero_identificacion, p.nit,
                    p.correo, p.celular, p.telefono,
                    p.ciudad, p.departamento, p.direccion,
                    p.especialidad_id, e.nombre as especialidad,
                    p.estado_cuenta, p.activo
                FROM profesionales p
                LEFT JOIN prenombres pr ON p.prenombre_id = pr.id
                LEFT JOIN especialidades e ON p.especialidad_id = e.id
                WHERE p.activo = TRUE
                ORDER BY p.id, p.apellidos, p.nombre
            """)
            rows = cur.fetchall()
            
            unique_results = []
            for r in rows:
                unique_results.append({
                    "id": r[0],
                    "nombre": r[1],
                    "apellidos": r[2],
                    "prenombre_id": r[3],
                    "prenombre": r[4],
                    "tipo_identificacion": r[5],
                    "numero_identificacion": r[6],
                    "nit": r[7],
                    "correo": r[8],
                    "celular": r[9],
                    "telefono": r[10],
                    "ciudad": r[11],
                    "departamento": r[12],
                    "direccion": r[13],
                    "especialidad_id": r[14],
                    "especialidad": r[15],
                    "estado_cuenta": r[16],
                    "activo": r[17],
                    "nombre_completo": f"{r[4] if r[4] else ''} {r[1]} {r[2]}".strip()
                })
            return unique_results
    finally:
        conn.close()

# NUEVA FUNCIÓN: Obtener profesionales por especialidad
def listar_profesionales_por_especialidad(especialidad_codigo: str):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            # Usamos DISTINCT ON para evitar duplicados si un profesional cumple ambas condiciones
            # (tener la especialidad como principal Y como secundaria, o tener multiples secundarias que coincidan si fuera el caso)
            # En PostgreSQL DISTINCT aplica a toda la fila seleccionada.
            cur.execute("""
                SELECT DISTINCT
                    p.id, p.nombre, p.apellidos, pr.nombre as prenombre,
                    p.numero_identificacion, p.especialidad_id
                FROM profesionales p
                LEFT JOIN prenombres pr ON p.prenombre_id = pr.id
                INNER JOIN especialidades e ON p.especialidad_id = e.id
                LEFT JOIN profesional_especialidades_secundarias pes ON p.id = pes.profesional_id
                LEFT JOIN especialidades esec ON pes.especialidad_id = esec.id
                WHERE (e.codigo = %s OR esec.codigo = %s)
                  AND p.activo = TRUE
                  AND p.estado_cuenta = 'Habilitada'
                ORDER BY p.apellidos, p.nombre
            """, (especialidad_codigo, especialidad_codigo))
            rows = cur.fetchall()
            
            # Procesamiento extra en Python para asegurar unicidad por ID si el SQL fallara en algún edge case
            seen_ids = set()
            unique_results = []
            
            for r in rows:
                if r[0] not in seen_ids:
                    seen_ids.add(r[0])
                    unique_results.append({
                        "id": r[0],
                        "nombre": r[1],
                        "apellidos": r[2],
                        "prenombre": r[3],
                        "numero_identificacion": r[4],
                        "especialidad_id": r[5],
                        "nombre_completo": f"{r[3] if r[3] else ''} {r[1]} {r[2]}".strip()
                    })
            
            return unique_results
    finally:
        conn.close()

def obtener_profesional(profesional_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    p.id, p.nombre, p.apellidos, p.prenombre_id,
                    p.tipo_identificacion, p.numero_identificacion, p.nit,
                    p.correo, p.celular, p.telefono,
                    p.ciudad, p.departamento, p.direccion,
                    p.especialidad_id, p.estado_cuenta, p.activo
                FROM profesionales p
                WHERE p.id = %s
            """, (profesional_id,))
            
            # Nota: Quitamos nombre_completo de la query ya que no existe columna
            r = cur.fetchone()
            if r:
                # Recuperar prenombre aparte si es necesario para armar nombre completo, 
                # pero aqui devolvemos raw data
                 return {
                    "id": r[0],
                    "nombre": r[1],
                    "apellidos": r[2],
                    "prenombre_id": r[3],
                    "tipo_identificacion": r[4],
                    "numero_identificacion": r[5],
                    "nit": r[6],
                    "correo": r[7],
                    "celular": r[8],
                    "telefono": r[9],
                    "ciudad": r[10],
                    "departamento": r[11],
                    "direccion": r[12],
                    "especialidad_id": r[13],
                    "estado_cuenta": r[14],
                    "activo": r[15]
                 }
            return None
    finally:
        conn.close()

def obtener_profesional_por_identificacion(identificacion: str):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    p.id, p.nombre, p.apellidos, p.prenombre_id,
                    p.tipo_identificacion, p.numero_identificacion, p.nit,
                    p.correo, p.celular, p.telefono,
                    p.ciudad, p.departamento, p.direccion,
                    p.especialidad_id, p.estado_cuenta, p.activo,
                    CONCAT(p.nombre, ' ', p.apellidos) as nombre_completo
                FROM profesionales p
                WHERE p.numero_identificacion = %s OR p.correo = %s
            """, (identificacion, identificacion))
            
            r = cur.fetchone()
            if r:
                 return {
                    "id": r[0],
                    "nombre": r[1],
                    "apellidos": r[2],
                    "prenombre_id": r[3],
                    "tipo_identificacion": r[4],
                    "numero_identificacion": r[5],
                    "nit": r[6],
                    "correo": r[7],
                    "celular": r[8],
                    "telefono": r[9],
                    "ciudad": r[10],
                    "departamento": r[11],
                    "direccion": r[12],
                    "especialidad_id": r[13],
                    "estado_cuenta": r[14],
                    "activo": r[15],
                    "nombre_completo": r[16]
                 }
            return None
    finally:
        conn.close()

def crear_profesional(data: dict):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO profesionales (
                    nombre, apellidos, prenombre_id, tipo_identificacion, numero_identificacion,
                    nit, correo, celular, telefono,
                    ciudad, departamento, direccion, especialidad_id, estado_cuenta, activo, nombre_completo
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                data['nombre'], data['apellidos'], data.get('prenombre_id'),
                data['tipo_identificacion'], data['numero_identificacion'],
                data.get('nit'), data.get('correo'), data.get('celular'),
                data.get('telefono'),
                data.get('ciudad'), data.get('departamento'), data.get('direccion'),
                data.get('especialidad_id'), data.get('estado_cuenta', 'Habilitada'),
                data.get('activo', True), data.get('nombre_completo', '')
            ))
            nuevo_id = cur.fetchone()[0]
            conn.commit()
            return nuevo_id
    finally:
        conn.close()

def actualizar_profesional(profesional_id: int, data: dict):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                UPDATE profesionales
                SET nombre = %s, apellidos = %s, prenombre_id = %s,
                    tipo_identificacion = %s, numero_identificacion = %s,
                    nit = %s, correo = %s, celular = %s, telefono = %s,
                    ciudad = %s, departamento = %s,
                    direccion = %s, especialidad_id = %s, estado_cuenta = %s,
                    activo = %s, nombre_completo = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                data['nombre'], data['apellidos'], data.get('prenombre_id'),
                data['tipo_identificacion'], data['numero_identificacion'],
                data.get('nit'), data.get('correo'), data.get('celular'),
                data.get('telefono'),
                data.get('ciudad'), data.get('departamento'), data.get('direccion'),
                data.get('especialidad_id'), data.get('estado_cuenta', 'Habilitada'),
                data.get('activo', True), data.get('nombre_completo', ''), profesional_id
            ))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()

def eliminar_profesional(profesional_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("UPDATE profesionales SET activo = FALSE WHERE id = %s", (profesional_id,))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()

# ========== ESPECIALIDADES SECUNDARIAS ==========

def obtener_especialidades_secundarias(profesional_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT e.id, e.codigo, e.nombre
                FROM profesional_especialidades_secundarias pes
                INNER JOIN especialidades e ON pes.especialidad_id = e.id
                WHERE pes.profesional_id = %s AND e.activo = TRUE
                ORDER BY e.nombre
            """, (profesional_id,))
            rows = cur.fetchall()
            return [{"id": r[0], "codigo": r[1], "nombre": r[2]} for r in rows]
    finally:
        conn.close()

def agregar_especialidad_secundaria(profesional_id: int, especialidad_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                INSERT INTO profesional_especialidades_secundarias (profesional_id, especialidad_id)
                VALUES (%s, %s)
                ON CONFLICT (profesional_id, especialidad_id) DO NOTHING
            """, (profesional_id, especialidad_id))
            conn.commit()
            return True
    finally:
        conn.close()

def eliminar_especialidad_secundaria(profesional_id: int, especialidad_id: int):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                DELETE FROM profesional_especialidades_secundarias
                WHERE profesional_id = %s AND especialidad_id = %s
            """, (profesional_id, especialidad_id))
            conn.commit()
            return cur.rowcount > 0
    finally:
        conn.close()

def actualizar_especialidades_secundarias(profesional_id: int, especialidades_ids: list):
    """Reemplaza todas las especialidades secundarias del profesional"""
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            # Eliminar todas las existentes
            cur.execute("DELETE FROM profesional_especialidades_secundarias WHERE profesional_id = %s", (profesional_id,))
            
            # Insertar las nuevas
            for esp_id in especialidades_ids:
                cur.execute("""
                    INSERT INTO profesional_especialidades_secundarias (profesional_id, especialidad_id)
                    VALUES (%s, %s)
                """, (profesional_id, esp_id))
            
            conn.commit()
            return True
    finally:
        conn.close()
