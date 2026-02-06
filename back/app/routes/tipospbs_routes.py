# app/routes/tipospbs_routes.py
from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from app.control.tipospbs_control import *
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/tipospbs",
    tags=["tipospbs"],
    dependencies=[Depends(get_current_user_token)],
)

class TipoPBSRequest(BaseModel):
    codigo: str
    nombre: str
    activo: bool = True

@router.get("/")
def listar():
    return listar_tipos_pbs()

@router.get("/{tipo_id}")
def obtener(tipo_id: int):
    return obtener_tipo_pbs(tipo_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: TipoPBSRequest):
    return crear_tipo_pbs(body.dict())

@router.put("/{tipo_id}")
def actualizar(tipo_id: int, body: TipoPBSRequest):
    return actualizar_tipo_pbs(tipo_id, body.dict())

@router.delete("/{tipo_id}")
def eliminar(tipo_id: int):
    return eliminar_tipo_pbs(tipo_id)
