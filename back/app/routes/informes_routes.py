# app/routes/informes_routes.py

from fastapi import APIRouter, Depends
from datetime import date
from app.control import informes_control
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/informes",
    tags=["informes"],
    dependencies=[Depends(get_current_user_token)],
)

@router.get("/oportunidad")
def get_reporte_oportunidad(anio: int, trimestre: int):
    return informes_control.obtener_reporte_oportunidad(anio, trimestre)

@router.get("/cancelaciones")
def get_reporte_cancelaciones(inicio: date, fin: date):
    return informes_control.obtener_reporte_cancelaciones(inicio, fin)

@router.get("/listado")
def get_reporte_listado(inicio: date, fin: date):
    return informes_control.obtener_reporte_listado(inicio, fin)
