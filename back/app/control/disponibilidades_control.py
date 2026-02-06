# app/control/disponibilidades_control.py

from app.database import disponibilidades_repo

def listar_disponibilidades():
    return {"data": disponibilidades_repo.listar_disponibilidades()}

def obtener_disponibilidades_profesional(profesional_id: int):
    return {"data": disponibilidades_repo.obtener_disponibilidades_profesional(profesional_id)}

def crear_disponibilidad(data: dict):
    nuevo_id = disponibilidades_repo.crear_disponibilidad(data)
    return {"message": "Disponibilidad creada exitosamente", "id": nuevo_id}

def eliminar_disponibilidad(disponibilidad_id: int):
    if disponibilidades_repo.eliminar_disponibilidad(disponibilidad_id):
        return {"message": "Disponibilidad eliminada exitosamente"}
    return {"error": "No se pudo eliminar la disponibilidad"}

def crear_disponibilidades_lote(profesional_id: int, disponibilidades: list):
    disponibilidades_repo.crear_disponibilidades_lote(profesional_id, disponibilidades)
    return {"message": "Disponibilidades actualizadas exitosamente"}
