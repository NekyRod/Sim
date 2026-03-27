# app/routes/facturas_routes.py
from fastapi import APIRouter, status, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from app.control.facturas_control import (
    crear_factura,
    listar_facturas,
    obtener_factura,
    anular_factura,
)
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/facturas",
    tags=["facturas"],
    dependencies=[Depends(get_current_user_token)],
)


class FacturaItemRequest(BaseModel):
    codigo_cups: str
    descripcion: str
    cantidad: int = 1
    valor_unitario: float
    iva_porcentaje: float = 0


class FacturaRequest(BaseModel):
    paciente_id: int
    profesional_id: Optional[int] = None
    cita_id: Optional[int] = None
    regimen: str = "particular"
    copago: float = 0
    cuota_moderadora: float = 0
    observaciones: Optional[str] = None
    items: List[FacturaItemRequest]


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: FacturaRequest):
    return crear_factura(body.dict())


@router.get("/")
def listar(
    paciente_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    fecha_desde: Optional[str] = Query(None),
    fecha_hasta: Optional[str] = Query(None),
):
    return listar_facturas(
        paciente_id=paciente_id, estado=estado,
        fecha_desde=fecha_desde, fecha_hasta=fecha_hasta
    )


@router.get("/{factura_id}")
def obtener(factura_id: int):
    return obtener_factura(factura_id)


@router.put("/{factura_id}/anular")
def anular(factura_id: int):
    return anular_factura(factura_id)
