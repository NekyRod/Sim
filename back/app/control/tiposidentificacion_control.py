# app/control/tiposidentificacion_control.py

from fastapi import HTTPException
from app.database import tiposidentificacion_repo

def listar_tipos_identificacion():
    """Lista todos los tipos de identificación activos"""
    tipos = tiposidentificacion_repo.get_all_tipos_identificacion()
    return {"data": tipos}

def obtener_tipo_identificacion(tipo_id: int):
    """Obtiene un tipo de identificación por ID"""
    tipo = tiposidentificacion_repo.get_tipo_identificacion_by_id(tipo_id)
    if not tipo:
        raise HTTPException(
            status_code=404,
            detail=f"Tipo de identificación con ID {tipo_id} no encontrado"
        )
    return tipo

def crear_tipo_identificacion(data: dict):
    """Crea un nuevo tipo de identificación"""
    # Validaciones
    if not data.get("codigo") or not data.get("nombre"):
        raise HTTPException(
            status_code=400,
            detail="Código y nombre son obligatorios"
        )
    
    if len(data["codigo"]) > 10:
        raise HTTPException(
            status_code=400,
            detail="El código no puede exceder 10 caracteres"
        )
    
    try:
        tipo_id = tiposidentificacion_repo.create_tipo_identificacion(data)
        return {
            "id": tipo_id,
            "message": "Tipo de identificación creado correctamente"
        }
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail=f"El código '{data['codigo']}' ya existe"
            )
        raise HTTPException(status_code=500, detail=str(e))

def actualizar_tipo_identificacion(tipo_id: int, data: dict):
    """Actualiza un tipo de identificación"""
    if not data.get("codigo") or not data.get("nombre"):
        raise HTTPException(
            status_code=400,
            detail="Código y nombre son obligatorios"
        )
    
    try:
        rows = tiposidentificacion_repo.update_tipo_identificacion(tipo_id, data)
        if rows == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Tipo de identificación con ID {tipo_id} no encontrado"
            )
        return {"message": "Tipo de identificación actualizado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail=f"El código '{data['codigo']}' ya existe"
            )
        raise HTTPException(status_code=500, detail=str(e))

def eliminar_tipo_identificacion(tipo_id: int):
    """Elimina (desactiva) un tipo de identificación"""
    rows = tiposidentificacion_repo.delete_tipo_identificacion(tipo_id)
    if rows == 0:
        raise HTTPException(
            status_code=404,
            detail=f"Tipo de identificación con ID {tipo_id} no encontrado"
        )
    return {"message": "Tipo de identificación eliminado correctamente"}
