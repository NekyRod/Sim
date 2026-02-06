
from fastapi import HTTPException
from app.database import rangos_bloqueados_repo

def obtener_rangos_bloqueados(profesional_id: int = None, fecha: str = None):
    return {"data": rangos_bloqueados_repo.listar_rangos_bloqueados(profesional_id, fecha)}

def registrar_rango_bloqueado(data: dict):
    # Validaciones básicas
    if not all(k in data for k in ["profesional_id", "fecha", "hora_inicio", "hora_fin"]):
        raise HTTPException(status_code=400, detail="Faltan campos obligatorios")
    
    # Aquí se podrían agregar validaciones de superposición con otros bloqueos
    
    try:
        id = rangos_bloqueados_repo.crear_rango_bloqueado(data)
        return {"id": id, "message": "Rango bloqueado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def borrar_rango_bloqueado(id: int):
    exito = rangos_bloqueados_repo.eliminar_rango_bloqueado(id)
    if not exito:
        raise HTTPException(status_code=404, detail="Rango bloqueado no encontrado")
    return {"message": "Rango bloqueado eliminado correctamente"}
