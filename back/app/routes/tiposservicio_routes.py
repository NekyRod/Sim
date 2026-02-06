# app/routes/tiposservicio_routes.py
from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from app.control.tiposservicio_control import *
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/tiposservicio",
    tags=["tiposservicio"],
    dependencies=[Depends(get_current_user_token)],
)

class TipoServicioRequest(BaseModel):
    codigo: str
    nombre: str
    activo: bool = True

@router.get("/")
def listar():
    return listar_tipos_servicio()

@router.get("/{tipo_id}")
def obtener(tipo_id: int):
    return obtener_tipo_servicio(tipo_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: TipoServicioRequest):
    return crear_tipo_servicio(body.dict())

@router.put("/{tipo_id}")
def actualizar(tipo_id: int, body: TipoServicioRequest):
    return actualizar_tipo_servicio(tipo_id, body.dict())

@router.delete("/{tipo_id}")
def eliminar(tipo_id: int):
    return eliminar_tipo_servicio(tipo_id)
