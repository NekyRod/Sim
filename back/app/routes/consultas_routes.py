
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.database.consultas_repo import ConsultasRepo
from pydantic import BaseModel

router = APIRouter(prefix="/pacientes", tags=["consultas"])

class ConsultaCreate(BaseModel):
    paciente_id: int
    profesional_id: Optional[int] = None
    motivo: Optional[str] = None
    enfermedad_actual: Optional[str] = None
    diagnostico_cie10_codigo: Optional[str] = None
    diagnostico_cie10_texto: Optional[str] = None
    plan_tratamiento: Optional[str] = None
    observaciones: Optional[str] = None
    registrado_por: Optional[str] = None

@router.get("/{paciente_id}/consultas")
def get_consultas(paciente_id: int):
    return ConsultasRepo.get_by_paciente(paciente_id)

@router.post("/consultas")
def create_consulta(data: ConsultaCreate):
    try:
        return ConsultasRepo.create(data.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/consultas/{consulta_id}")
def delete_consulta(consulta_id: int):
    if ConsultasRepo.delete(consulta_id):
        return {"message": "Consulta eliminada"}
    raise HTTPException(status_code=404, detail="No encontrada")
