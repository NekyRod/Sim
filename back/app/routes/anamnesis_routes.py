
from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.control.anamnesis_control import get_anamnesis_control, upsert_anamnesis_control
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/pacientes",
    tags=["anamnesis"],
    dependencies=[Depends(get_current_user_token)],
)

class AnamnesisRequest(BaseModel):
    antece_medicos: Dict[str, Any]
    observaciones: Optional[str] = ""
    motivo_consulta: Optional[str] = None
    escala_dolor: Optional[int] = None
    cie10_codigo: Optional[str] = None
    cie10_texto: Optional[str] = None
    registrado_por: Optional[str] = None

@router.get("/{paciente_id}/anamnesis")
def get_anamnesis(paciente_id: int):
    return get_anamnesis_control(paciente_id)

@router.put("/{paciente_id}/anamnesis")
def save_anamnesis(paciente_id: int, body: AnamnesisRequest):
    return upsert_anamnesis_control(paciente_id, body)
