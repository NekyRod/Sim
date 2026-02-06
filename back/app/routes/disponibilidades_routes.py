# app/routes/disponibilidades_routes.py

from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from typing import List
from app.control import disponibilidades_control
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/disponibilidades",
    tags=["disponibilidades"],
    dependencies=[Depends(get_current_user_token)],
)

class DisponibilidadRequest(BaseModel):
    profesional_id: int
    dia_semana: int  # 0=Domingo, 1=Lunes, ..., 6=Sábado
    hora_inicio: str
    hora_fin: str
    activo: bool = True

class DisponibilidadLoteItem(BaseModel):
    dia_semana: int
    hora_inicio: str
    hora_fin: str

class DisponibilidadLoteRequest(BaseModel):
    disponibilidades: List[DisponibilidadLoteItem]

@router.get("/")
def listar():
    return disponibilidades_control.listar_disponibilidades()

@router.get("/profesional/{profesional_id}")
def obtener_por_profesional(profesional_id: int):
    return disponibilidades_control.obtener_disponibilidades_profesional(profesional_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: DisponibilidadRequest):
    return disponibilidades_control.crear_disponibilidad(body.dict())

@router.delete("/{disponibilidad_id}")
def eliminar(disponibilidad_id: int):
    return disponibilidades_control.eliminar_disponibilidad(disponibilidad_id)

@router.post("/profesional/{profesional_id}/lote")
def crear_lote(profesional_id: int, body: DisponibilidadLoteRequest):
    return disponibilidades_control.crear_disponibilidades_lote(
        profesional_id, 
        [d.dict() for d in body.disponibilidades]
    )
