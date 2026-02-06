# app/control/especialidades_control.py

from app.database import especialidades_repo

def listar_especialidades(solo_activos: bool = False):
    return {"data": especialidades_repo.listar_especialidades(solo_activos)}

def obtener_especialidad_by_id(especialidad_id: int):
    row = especialidades_repo.obtener_especialidad(especialidad_id)
    if not row:
        return None
    return {
        "id": row[0],
        "codigo": row[1],
        "nombre": row[2],
        "activo": row[3]
    }

def crear_especialidad(data: dict):
    nuevo_id = especialidades_repo.crear_especialidad(data)
    return {"message": "Especialidad creada exitosamente", "id": nuevo_id}

def actualizar_especialidad(especialidad_id: int, data: dict):
    if especialidades_repo.actualizar_especialidad(especialidad_id, data):
        return {"message": "Especialidad actualizada exitosamente"}
    return {"error": "No se pudo actualizar la especialidad"}

def eliminar_especialidad(especialidad_id: int):
    if especialidades_repo.eliminar_especialidad(especialidad_id):
        return {"message": "Especialidad eliminada exitosamente"}
    return {"error": "No se pudo eliminar la especialidad"}
