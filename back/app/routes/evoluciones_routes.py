
from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.database.evoluciones_repo import EvolucionesRepo
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/pacientes", tags=["evoluciones"])

class EvolucionCreate(BaseModel):
    paciente_id: int
    profesional_id: int = None
    nota: str
    registrado_por: str = None

@router.get("/{paciente_id}/evoluciones")
def get_evoluciones(paciente_id: int):
    return EvolucionesRepo.get_by_paciente(paciente_id)

@router.post("/evoluciones")
def create_evolucion(data: EvolucionCreate):
    try:
        return EvolucionesRepo.create(data.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/evoluciones/{evolucion_id}")
def delete_evolucion(evolucion_id: int):
    if EvolucionesRepo.delete(evolucion_id):
        return {"message": "Evolución eliminada"}
    raise HTTPException(status_code=404, detail="No encontrada")
