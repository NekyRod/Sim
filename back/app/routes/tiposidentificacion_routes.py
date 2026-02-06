# app/routes/tiposidentificacion_routes.py

from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from app.control.tiposidentificacion_control import (
    listar_tipos_identificacion,
    obtener_tipo_identificacion,
    crear_tipo_identificacion,
    actualizar_tipo_identificacion,
    eliminar_tipo_identificacion
)
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/tiposidentificacion",
    tags=["tiposidentificacion"],
    dependencies=[Depends(get_current_user_token)],  # ← protege TODO el router
)

class TipoIdentificacionRequest(BaseModel):
    codigo: str
    nombre: str
    activo: bool = True

@router.get("/")
def listar_tipos():
    """GET /tiposidentificacion - Lista todos los tipos activos"""
    return listar_tipos_identificacion()

@router.get("/{tipo_id}")
def obtener_tipo(tipo_id: int):
    """GET /tiposidentificacion/:id - Obtiene un tipo por ID"""
    return obtener_tipo_identificacion(tipo_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_tipo(body: TipoIdentificacionRequest):
    """POST /tiposidentificacion - Crea un nuevo tipo"""
    return crear_tipo_identificacion(body.dict())

@router.put("/{tipo_id}")
def actualizar_tipo(tipo_id: int, body: TipoIdentificacionRequest):
    """PUT /tiposidentificacion/:id - Actualiza un tipo"""
    return actualizar_tipo_identificacion(tipo_id, body.dict())

@router.delete("/{tipo_id}")
def eliminar_tipo(tipo_id: int):
    """DELETE /tiposidentificacion/:id - Elimina (desactiva) un tipo"""
    return eliminar_tipo_identificacion(tipo_id)
