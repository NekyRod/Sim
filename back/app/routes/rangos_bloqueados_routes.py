
from fastapi import APIRouter, Depends, Query
from app.control import rangos_bloqueados_control
from app.config.security import get_current_user_token
from pydantic import BaseModel
from typing import Optional

router = APIRouter(
    prefix="/rangos-bloqueados",
    tags=["rangos-bloqueados"],
    dependencies=[Depends(get_current_user_token)]
)

class RangoBloqueadoRequest(BaseModel):
    profesional_id: int
    fecha: str
    hora_inicio: str
    hora_fin: str
    descripcion: Optional[str] = ""

@router.get("/")
def get_rangos(profesional_id: Optional[int] = None, fecha: Optional[str] = None):
    return rangos_bloqueados_control.obtener_rangos_bloqueados(profesional_id, fecha)

@router.post("/")
def create_rango(body: RangoBloqueadoRequest):
    return rangos_bloqueados_control.registrar_rango_bloqueado(body.dict())

@router.delete("/{id}")
def delete_rango(id: int):
    return rangos_bloqueados_control.borrar_rango_bloqueado(id)
