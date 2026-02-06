# app/routes/ciudadesresidencia_routes.py
from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from app.control.ciudadesresidencia_control import *
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/ciudadesresidencia",
    tags=["ciudadesresidencia"],
    dependencies=[Depends(get_current_user_token)],
)

class CiudadRequest(BaseModel):
    nombre: str
    activo: bool = True

@router.get("/")
def listar():
    return listar_ciudades()

@router.get("/{ciudad_id}")
def obtener(ciudad_id: int):
    return obtener_ciudad(ciudad_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: CiudadRequest):
    return crear_ciudad(body.dict())

@router.put("/{ciudad_id}")
def actualizar(ciudad_id: int, body: CiudadRequest):
    return actualizar_ciudad(ciudad_id, body.dict())

@router.delete("/{ciudad_id}")
def eliminar(ciudad_id: int):
    return eliminar_ciudad(ciudad_id)
