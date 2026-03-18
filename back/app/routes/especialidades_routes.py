# app/routes/especialidades_routes.py

from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from typing import Optional
from app.control import especialidades_control
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/especialidades",
    tags=["especialidades"],
    dependencies=[Depends(get_current_user_token)],
)

class EspecialidadRequest(BaseModel):
    codigo: str
    nombre: str
    activo: Optional[bool] = True
    es_autogestion: Optional[bool] = False

@router.get("/")
def listar(solo_activos: bool = True):
    return especialidades_control.listar_especialidades(solo_activos)

@router.get("/{especialidad_id}")
def obtener(especialidad_id: int):
    return especialidades_control.obtener_especialidad_by_id(especialidad_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: EspecialidadRequest):
    return especialidades_control.crear_especialidad(body.dict())

@router.put("/{especialidad_id}")
def actualizar(especialidad_id: int, body: EspecialidadRequest):
    return especialidades_control.actualizar_especialidad(especialidad_id, body.dict())

@router.delete("/{especialidad_id}")
def eliminar(especialidad_id: int):
    return especialidades_control.eliminar_especialidad(especialidad_id)
