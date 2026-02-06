# app/control/ciudadesresidencia_control.py
from fastapi import HTTPException
from app.database import ciudadesresidencia_repo

def listar_ciudades():
    ciudades = ciudadesresidencia_repo.get_all_ciudades()
    return {"data": ciudades}

def obtener_ciudad(ciudad_id: int):
    ciudad = ciudadesresidencia_repo.get_ciudad_by_id(ciudad_id)
    if not ciudad:
        raise HTTPException(status_code=404, detail=f"Ciudad con ID {ciudad_id} no encontrada")
    return ciudad

def crear_ciudad(data: dict):
    if not data.get("nombre"):
        raise HTTPException(status_code=400, detail="Nombre es obligatorio")
    
    try:
        ciudad_id = ciudadesresidencia_repo.create_ciudad(data)
        return {"id": ciudad_id, "message": "Ciudad creada correctamente"}
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail=f"La ciudad '{data['nombre']}' ya existe")
        raise HTTPException(status_code=500, detail=str(e))

def actualizar_ciudad(ciudad_id: int, data: dict):
    if not data.get("nombre"):
        raise HTTPException(status_code=400, detail="Nombre es obligatorio")
    
    rows = ciudadesresidencia_repo.update_ciudad(ciudad_id, data)
    if rows == 0:
        raise HTTPException(status_code=404, detail=f"Ciudad con ID {ciudad_id} no encontrada")
    return {"message": "Ciudad actualizada correctamente"}

def eliminar_ciudad(ciudad_id: int):
    rows = ciudadesresidencia_repo.delete_ciudad(ciudad_id)
    if rows == 0:
        raise HTTPException(status_code=404, detail=f"Ciudad con ID {ciudad_id} no encontrada")
    return {"message": "Ciudad eliminada correctamente"}
