# app/control/tarifas_control.py
from fastapi import HTTPException
from app.database import tarifas_repo


def listar_tarifas(solo_activas: bool = True):
    try:
        tarifas = tarifas_repo.get_all_tarifas(solo_activas)
        return {"data": tarifas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listando tarifas: {str(e)}")


def obtener_tarifa(tarifa_id: int):
    tarifa = tarifas_repo.get_tarifa_by_id(tarifa_id)
    if not tarifa:
        raise HTTPException(status_code=404, detail=f"Tarifa con ID {tarifa_id} no encontrada")
    return tarifa


def obtener_tarifa_por_cups(codigo_cups: str):
    tarifa = tarifas_repo.get_tarifa_by_cups(codigo_cups)
    if not tarifa:
        raise HTTPException(status_code=404, detail=f"Tarifa con código CUPS '{codigo_cups}' no encontrada")
    return tarifa


def crear_tarifa(data: dict):
    if not data.get("codigo_cups") or not data.get("descripcion"):
        raise HTTPException(status_code=400, detail="Código CUPS y descripción son obligatorios")

    if data.get("valor", 0) < 0:
        raise HTTPException(status_code=400, detail="El valor no puede ser negativo")

    try:
        tarifa_id = tarifas_repo.create_tarifa(data)
        return {"id": tarifa_id, "message": "Tarifa creada correctamente"}
    except Exception as e:
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            raise HTTPException(status_code=400, detail=f"El código CUPS '{data['codigo_cups']}' ya existe")
        raise HTTPException(status_code=500, detail=str(e))


def actualizar_tarifa(tarifa_id: int, data: dict):
    if not data.get("codigo_cups") or not data.get("descripcion"):
        raise HTTPException(status_code=400, detail="Código CUPS y descripción son obligatorios")

    rows = tarifas_repo.update_tarifa(tarifa_id, data)
    if rows == 0:
        raise HTTPException(status_code=404, detail=f"Tarifa con ID {tarifa_id} no encontrada")
    return {"message": "Tarifa actualizada correctamente"}


def eliminar_tarifa(tarifa_id: int):
    rows = tarifas_repo.delete_tarifa(tarifa_id)
    if rows == 0:
        raise HTTPException(status_code=404, detail=f"Tarifa con ID {tarifa_id} no encontrada")
    return {"message": "Tarifa eliminada correctamente"}
