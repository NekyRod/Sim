
from fastapi import HTTPException
from app.database import festivos_repo

def obtener_festivos():
    return {"data": festivos_repo.listar_festivos()}

def registrar_festivo(data: dict):
    if not data.get("fecha"):
        raise HTTPException(status_code=400, detail="La fecha es obligatoria")
    try:
        id = festivos_repo.crear_festivo(data["fecha"], data.get("descripcion", ""))
        return {"id": id, "message": "Festivo creado correctamente"}
    except Exception as e:
        if "unique" in str(e).lower():
            raise HTTPException(status_code=400, detail="Ya existe un festivo para esta fecha")
        raise HTTPException(status_code=500, detail=str(e))

def borrar_festivo(id: int):
    exito = festivos_repo.eliminar_festivo(id)
    if not exito:
        raise HTTPException(status_code=404, detail="Festivo no encontrado")
    return {"message": "Festivo eliminado correctamente"}
