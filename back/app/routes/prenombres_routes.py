# app/routes/prenombres_routes.py

from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from typing import Optional
from app.control import prenombres_control
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/prenombres",
    tags=["prenombres"],
    dependencies=[Depends(get_current_user_token)],
)

class PrenombreRequest(BaseModel):
    nombre: str
    activo: Optional[bool] = True

@router.get("/")
def listar():
    return prenombres_control.listar_prenombres()

@router.get("/{prenombre_id}")
def obtener(prenombre_id: int):
    return prenombres_control.obtener_prenombre_by_id(prenombre_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: PrenombreRequest):
    return prenombres_control.crear_prenombre(body.dict())

@router.put("/{prenombre_id}")
def actualizar(prenombre_id: int, body: PrenombreRequest):
    return prenombres_control.actualizar_prenombre(prenombre_id, body.dict())

@router.delete("/{prenombre_id}")
def eliminar(prenombre_id: int):
    return prenombres_control.eliminar_prenombre(prenombre_id)
