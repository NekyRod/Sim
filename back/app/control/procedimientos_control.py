# app/control/procedimientos_control.py

from fastapi import HTTPException, status
from typing import List, Dict, Any
from app.database import procedimientos_repo

def get_todos_procedimientos_control() -> List[Dict[str, Any]]:
    """Listar todo el catálogo para la vista Admin (incluye inactivos)"""
    return procedimientos_repo.get_todos_procedimientos()

def crear_procedimiento_control(data: dict) -> int:
    """Valida y crea un nuevo procedimiento clínico."""
    if not data.get('nombre'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre del procedimiento es obligatorio.")
    if not data.get('color_hex') or len(data.get('color_hex')) < 4:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Se requiere un código HEX de color válido.")
    
    try:
        return procedimientos_repo.crear_procedimiento(data)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al crear procedimiento: {str(e)}")

def actualizar_procedimiento_control(proc_id: int, data: dict) -> int:
    """Actualiza configuración de un hallazgo o tratamiento"""
    try:
        return procedimientos_repo.actualizar_procedimiento(proc_id, data)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error actualizando procedimiento: {str(e)}")

def eliminar_procedimiento_control(proc_id: int) -> dict:
    """Desactiva o borra el procedimiento dependiendo de su uso clínico previo."""
    try:
        return procedimientos_repo.eliminar_procedimiento(proc_id)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error borrando procedimiento: {str(e)}")
