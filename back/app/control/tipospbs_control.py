# app/control/tipospbs_control.py
from fastapi import HTTPException
from app.database import tipospbs_repo

def listar_tipos_pbs():
    tipos = tipospbs_repo.get_all_tipos_pbs()
    return {"data": tipos}

def obtener_tipo_pbs(tipo_id: int):
    tipo = tipospbs_repo.get_tipo_pbs_by_id(tipo_id)
    if not tipo:
        raise HTTPException(status_code=404, detail=f"Tipo PBS con ID {tipo_id} no encontrado")
    return tipo

def crear_tipo_pbs(data: dict):
    if not data.get("codigo") or not data.get("nombre"):
        raise HTTPException(status_code=400, detail="Código y nombre son obligatorios")
    
    try:
        tipo_id = tipospbs_repo.create_tipo_pbs(data)
        return {"id": tipo_id, "message": "Tipo PBS creado correctamente"}
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail=f"El código '{data['codigo']}' ya existe")
        raise HTTPException(status_code=500, detail=str(e))

def actualizar_tipo_pbs(tipo_id: int, data: dict):
    if not data.get("codigo") or not data.get("nombre"):
        raise HTTPException(status_code=400, detail="Código y nombre son obligatorios")
    
    rows = tipospbs_repo.update_tipo_pbs(tipo_id, data)
    if rows == 0:
        raise HTTPException(status_code=404, detail=f"Tipo PBS con ID {tipo_id} no encontrado")
    return {"message": "Tipo PBS actualizado correctamente"}

def eliminar_tipo_pbs(tipo_id: int):
    rows = tipospbs_repo.delete_tipo_pbs(tipo_id)
    if rows == 0:
        raise HTTPException(status_code=404, detail=f"Tipo PBS con ID {tipo_id} no encontrado")
    return {"message": "Tipo PBS eliminado correctamente"}
