# app/routes/tarifas_routes.py
from fastapi import APIRouter, status, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.control.tarifas_control import (
    listar_tarifas,
    obtener_tarifa,
    obtener_tarifa_por_cups,
    crear_tarifa,
    actualizar_tarifa,
    eliminar_tarifa,
)
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/tarifas",
    tags=["tarifas"],
    dependencies=[Depends(get_current_user_token)],
)


class TarifaRequest(BaseModel):
    codigo_cups: str
    descripcion: str
    valor: float = 0
    iva_porcentaje: float = 0
    activo: bool = True


@router.get("/")
def listar(solo_activas: bool = Query(True, description="Filtrar solo tarifas activas")):
    return listar_tarifas(solo_activas)


@router.get("/cups/{codigo_cups}")
def obtener_por_cups(codigo_cups: str):
    return obtener_tarifa_por_cups(codigo_cups)


@router.get("/{tarifa_id}")
def obtener(tarifa_id: int):
    return obtener_tarifa(tarifa_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: TarifaRequest):
    return crear_tarifa(body.dict())


@router.put("/{tarifa_id}")
def actualizar_endpoint(tarifa_id: int, body: TarifaRequest):
    return actualizar_tarifa(tarifa_id, body.dict())


@router.delete("/{tarifa_id}")
def eliminar_endpoint(tarifa_id: int):
    return eliminar_tarifa(tarifa_id)
