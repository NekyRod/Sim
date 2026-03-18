
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.database.recetas_repo import RecetasRepo
from pydantic import BaseModel

router = APIRouter(prefix="/pacientes", tags=["recetas"])

class Medicamento(BaseModel):
    nombre: str
    dosis: str
    frecuencia: str
    duracion: str

class RecetaCreate(BaseModel):
    paciente_id: int
    profesional_id: Optional[int] = None
    medicamentos: List[Medicamento]
    indicaciones_generales: Optional[str] = None
    registrado_por: Optional[str] = None

@router.get("/{paciente_id}/recetas")
def get_recetas(paciente_id: int):
    return RecetasRepo.get_by_paciente(paciente_id)

@router.post("/recetas")
def create_receta(data: RecetaCreate):
    try:
        return RecetasRepo.create(data.dict())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/recetas/{receta_id}")
def delete_receta(receta_id: int):
    if RecetasRepo.delete(receta_id):
        return {"message": "Receta eliminada"}
    raise HTTPException(status_code=404, detail="No encontrada")
