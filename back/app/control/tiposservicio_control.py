# app/control/tiposservicio_control.py
from fastapi import HTTPException
from app.database import tiposservicio_repo

def listar_tipos_servicio():
    tipos = tiposservicio_repo.get_all_tipos_servicio()
    return {"data": tipos}

def obtener_tipo_servicio(tipo_id: int):
    tipo = tiposservicio_repo.get_tipo_servicio_by_id(tipo_id)
    if not tipo:
        raise HTTPException(status_code=404, detail=f"Tipo de servicio con ID {tipo_id} no encontrado")
    return tipo

def crear_tipo_servicio(data: dict):
    if not data.get("codigo") or not data.get("nombre"):
        raise HTTPException(status_code=400, detail="Código y nombre son obligatorios")
    
    try:
        tipo_id = tiposservicio_repo.create_tipo_servicio(data)
        return {"id": tipo_id, "message": "Tipo de servicio creado correctamente"}
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail=f"El código '{data['codigo']}' ya existe")
        raise HTTPException(status_code=500, detail=str(e))

def actualizar_tipo_servicio(tipo_id: int, data: dict):
    if not data.get("codigo") or not data.get("nombre"):
        raise HTTPException(status_code=400, detail="Código y nombre son obligatorios")
    
    rows = tiposservicio_repo.update_tipo_servicio(tipo_id, data)
    if rows == 0:
        raise HTTPException(status_code=404, detail=f"Tipo de servicio con ID {tipo_id} no encontrado")
    return {"message": "Tipo de servicio actualizado correctamente"}

def eliminar_tipo_servicio(tipo_id: int):
    rows = tiposservicio_repo.delete_tipo_servicio(tipo_id)
    if rows == 0:
        raise HTTPException(status_code=404, detail=f"Tipo de servicio con ID {tipo_id} no encontrado")
    return {"message": "Tipo de servicio eliminado correctamente"}
