# app/routes/odontograma_routes.py

from fastapi import APIRouter, Depends, status, Response, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

from app.config.security import get_current_user_token
from app.control import odontograma_control

# Dependencies
router = APIRouter(
    prefix="/odontogramas",
    tags=["odontogramas"],
    dependencies=[Depends(get_current_user_token)],
)

import json
import os

# SCHEMAS
class DetalleDienteCreate(BaseModel):
    procedimiento_id: int
    pieza_dental: int = Field(..., ge=11, le=85, description="Nomenclatura FDI")
    cara: str # Oclusal, Mesial, Distal, Vestibular, Lingual, Palatina, Completo
    estado_completado: bool = True
    evolucion_porcentaje: Optional[int] = Field(100, ge=0, le=100, description="Porcentaje de avance del tratamiento")
    hallazgo: Optional[str] = None
    plan_tratamiento: Optional[str] = None
    cie10_codigo: Optional[str] = None
    cie10_texto: Optional[str] = None

class OdontogramaRegistroCreate(BaseModel):
    paciente_id: int
    profesional_id: Optional[int] = None
    registrado_por: Optional[str] = None
    detalles: List[DetalleDienteCreate] = Field(..., min_items=1)

# ROUTES
@router.get("/procedimientos")
def get_procedimientos():
    """
    Obtener todos los procedimientos habilitados para poblar la paleta de herramientas del odontograma.
    """
    return odontograma_control.get_procedimientos_control()

@router.get("/paciente/{paciente_id}/timeline")
def obtener_linea_tiempo_paciente(paciente_id: int):
    """
    Retorna la evolución histórica (línea de tiempo) del odontograma de un paciente.
    """
    return odontograma_control.get_paciente_timeline_control(paciente_id)

@router.put("/draft/{evaluacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def autoguardar_draft(evaluacion_id: str, payload: OdontogramaRegistroCreate):
    """
    Recibe el guardado en segundo plano (Debounce) del Frontend.
    Aplica chequeos clínicos estables antes de actualizar la BD temporal.
    """
    odontograma_control.autoguardar_evaluacion_control(evaluacion_id, payload)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{evaluacion_id}/finalizar", status_code=status.HTTP_200_OK)
def finalizar_odontograma(evaluacion_id: str):
    """
    Firma el documento y bloquea su edición permanente en el historial del paciente.
    """
    return odontograma_control.finalizar_evaluacion_control(evaluacion_id)

@router.delete("/{evaluacion_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_odontograma_route(evaluacion_id: str):
    """
    Elimina un registro de odontograma de la historia clínica.
    """
    odontograma_control.eliminar_odontograma_control(evaluacion_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/cie10/search")
def search_cie10(q: str = ""):
    """
    Buscador reactivo de códigos CIE-10 dentales.
    """
    file_path = os.path.join(os.path.dirname(__file__), "..", "utils", "cie10_data.json")
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        if not q:
            return data[:10]
            
        q = q.lower()
        results = [
            item for item in data 
            if q in item["codigo"].lower() or q in item["nombre"].lower()
        ]
        return results[:15]
    except Exception as e:
        print(f"Error reading CIE10 data: {e}")
        return []
