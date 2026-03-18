# app/control/profesionales_control.py

from app.database import profesionales_repo

def listar_profesionales():
    profesionales = profesionales_repo.listar_profesionales()
    # Agregar especialidades secundarias a cada profesional
    for prof in profesionales:
        prof['especialidades_secundarias'] = profesionales_repo.obtener_especialidades_secundarias(prof['id'])
    return {"data": profesionales}

def obtener_profesional_by_id(profesional_id: int):
    row = profesionales_repo.obtener_profesional(profesional_id)
    if not row:
        return None
    
    profesional = {
        "id": row[0],
        "nombre": row[1],
        "apellidos": row[2],
        "prenombre_id": row[3],
        "tipo_identificacion": row[4],
        "numero_identificacion": row[5],
        "nit": row[6],
        "correo": row[7],
        "celular": row[8],
        "telefono": row[9],
        "nombre_completo": row[10],
        "ciudad": row[11],
        "departamento": row[12],
        "direccion": row[13],
        "especialidad_id": row[14],
        "estado_cuenta": row[15],
        "activo": row[16]
    }
    
    # Agregar especialidades secundarias
    profesional['especialidades_secundarias'] = profesionales_repo.obtener_especialidades_secundarias(profesional_id)
    
    return profesional

def obtener_profesional_por_identificacion(identificacion: str):
    row = profesionales_repo.obtener_profesional_por_identificacion(identificacion)
    if not row:
        return None
    
    # Agregar especialidades secundarias
    row['especialidades_secundarias'] = profesionales_repo.obtener_especialidades_secundarias(row['id'])
    
    return row

def crear_profesional(data: dict):
    # Extraer especialidades secundarias
    especialidades_secundarias = data.pop('especialidades_secundarias', [])
    
    nuevo_id = profesionales_repo.crear_profesional(data)
    
    # Agregar especialidades secundarias
    if especialidades_secundarias:
        profesionales_repo.actualizar_especialidades_secundarias(nuevo_id, especialidades_secundarias)
    
    return {"message": "Profesional creado exitosamente", "id": nuevo_id}

def actualizar_profesional(profesional_id: int, data: dict):
    # Extraer especialidades secundarias
    especialidades_secundarias = data.pop('especialidades_secundarias', [])
    
    if profesionales_repo.actualizar_profesional(profesional_id, data):
        # Actualizar especialidades secundarias
        profesionales_repo.actualizar_especialidades_secundarias(profesional_id, especialidades_secundarias)
        return {"message": "Profesional actualizado exitosamente"}
    
    return {"error": "No se pudo actualizar el profesional"}

def eliminar_profesional(profesional_id: int):
    if profesionales_repo.eliminar_profesional(profesional_id):
        return {"message": "Profesional eliminado exitosamente"}
    return {"error": "No se pudo eliminar el profesional"}

def obtener_especialidades_secundarias(profesional_id: int):
    return {"data": profesionales_repo.obtener_especialidades_secundarias(profesional_id)}

def agregar_especialidad_secundaria(profesional_id: int, especialidad_id: int):
    profesionales_repo.agregar_especialidad_secundaria(profesional_id, especialidad_id)
    return {"message": "Especialidad secundaria agregada"}

def eliminar_especialidad_secundaria(profesional_id: int, especialidad_id: int):
    profesionales_repo.eliminar_especialidad_secundaria(profesional_id, especialidad_id)
    return {"message": "Especialidad secundaria eliminada"}

# AGREGAR al final del archivo profesionales_control.py

def listar_profesionales_por_especialidad(especialidad_codigo: str):
    return {"data": profesionales_repo.listar_profesionales_por_especialidad(especialidad_codigo)}
