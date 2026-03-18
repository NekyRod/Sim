# app/control/informes_control.py

from datetime import date
from app.database import informes_repo

def obtener_reporte_oportunidad(anio: int, trimestre: int):
    try:
        return {
            "status": "success",
            "data": informes_repo.get_reporte_oportunidad_repo(anio, trimestre)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def obtener_reporte_cancelaciones(fecha_inicio: date, fecha_fin: date):
    try:
        return {
            "status": "success",
            "data": informes_repo.get_reporte_cancelaciones_repo(fecha_inicio, fecha_fin)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

def obtener_reporte_listado(fecha_inicio: date, fecha_fin: date):
    try:
        return {
            "status": "success",
            "data": informes_repo.get_reporte_listado_repo(fecha_inicio, fecha_fin)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
