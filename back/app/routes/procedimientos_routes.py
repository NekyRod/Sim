# app/routes/procedimientos_routes.py

from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.config.security import get_current_user_token
from app.control import procedimientos_control

router = APIRouter(prefix="/config/procedimientos", tags=["Configuración de Procedimientos"])

# Pydantic Schemas
class ProcedimientoCreate(BaseModel):
    nombre: str
    tipo: Optional[str] = 'Hallazgo'
    aplica_a_cara: Optional[bool] = True
    aplica_diente_completo: Optional[bool] = False
    color_hex: Optional[str] = '#000000'
    es_extraccion: Optional[bool] = False
    es_borrador: Optional[bool] = False
    activo: Optional[bool] = True

class ProcedimientoUpdate(ProcedimientoCreate):
    pass

@router.get("/", response_model=List[dict])
def listar_procedimientos(token=Depends(get_current_user_token)):
    """Obtiene el listado completo para el Administrador de Configuración."""
    return procedimientos_control.get_todos_procedimientos_control()

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_procedimiento(data: ProcedimientoCreate, token=Depends(get_current_user_token)):
    """Añade un nuevo hallazgo médico, diagnóstico o tratamiento a la base de datos central."""
    new_id = procedimientos_control.crear_procedimiento_control(data.dict())
    return {"id": new_id, "mensaje": "Procedimiento creado correctamente"}

@router.put("/{proc_id}", status_code=status.HTTP_200_OK)
def editar_procedimiento(proc_id: int, data: ProcedimientoUpdate, token=Depends(get_current_user_token)):
    """Edita las propiedades (nombre, color, alcance) de un procedimiento existente."""
    procedimientos_control.actualizar_procedimiento_control(proc_id, data.dict())
    return {"mensaje": "Procedimiento actualizado"}

@router.delete("/{proc_id}", status_code=status.HTTP_200_OK)
def eliminar_procedimiento(proc_id: int, token=Depends(get_current_user_token)):
    """Elimina o inactiva un procedimiento. Si ha sido usado en un paciente histórico, hace Soft Delete protegido."""
    return procedimientos_control.eliminar_procedimiento_control(proc_id)
