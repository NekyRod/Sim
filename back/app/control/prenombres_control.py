# app/control/prenombres_control.py

from app.database import prenombres_repo

def listar_prenombres():
    return {"data": prenombres_repo.listar_prenombres()}

def obtener_prenombre_by_id(prenombre_id: int):
    row = prenombres_repo.obtener_prenombre(prenombre_id)
    if not row:
        return None
    return {
        "id": row[0],
        "nombre": row[1],
        "activo": row[2]
    }

def crear_prenombre(data: dict):
    nuevo_id = prenombres_repo.crear_prenombre(data)
    return {"message": "Prenombre creado exitosamente", "id": nuevo_id}

def actualizar_prenombre(prenombre_id: int, data: dict):
    if prenombres_repo.actualizar_prenombre(prenombre_id, data):
        return {"message": "Prenombre actualizado exitosamente"}
    return {"error": "No se pudo actualizar el prenombre"}

def eliminar_prenombre(prenombre_id: int):
    if prenombres_repo.eliminar_prenombre(prenombre_id):
        return {"message": "Prenombre eliminado exitosamente"}
    return {"error": "No se pudo eliminar el prenombre"}
