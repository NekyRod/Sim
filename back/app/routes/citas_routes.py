# app/routes/citas_routes.py

from fastapi import APIRouter, status, Depends
from pydantic import BaseModel
from datetime import date, time
from typing import Optional
from app.control.citas_control import crear_cita_control, obtener_citas_rango, eliminar_cita_control, obtener_cita_id, obtener_citas_paciente_admin
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/citas",
    tags=["citas"],
    dependencies=[Depends(get_current_user_token)],
)

class CitaRequest(BaseModel):
    tipo_identificacion: str
    numero_identificacion: str
    nombre_paciente: str
    telefono_fijo: Optional[str] = None
    telefono_celular: Optional[str] = None
    segundo_telefono_celular: Optional[str] = None  # ← NUEVO
    titular_segundo_celular: Optional[str] = None  # ← NUEVO
    direccion: Optional[str] = None
    correo_electronico: Optional[str] = None
    lugar_residencia: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    tipo_doc_acompanante: Optional[str] = None  # ← NUEVO
    nombre_acompanante: Optional[str] = None  # ← NUEVO
    parentesco_acompanante: Optional[str] = None  # ← NUEVO
    profesional_id: int
    fecha_programacion: date
    fecha_solicitada: date
    hora: time
    hora_fin: Optional[time] = None  # Nuevo campo opcional por compatibilidad, pero idealmente requerido
    tipo_servicio: str
    tipo_pbs: Optional[str] = None
    mas_6_meses: bool = False
    motivo_cita: Optional[str] = None
    observacion: Optional[str] = None

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_cita(body: CitaRequest):
    return crear_cita_control(body)

@router.get("/profesional/{profesional_id}/rango")
def get_citas_rango(profesional_id: int, inicio: date, fin: date):
    """
    Obtener citas de un profesional en un rango de fechas (inicio y fin inclusive).
    Query params: inicio (YYYY-MM-DD), fin (YYYY-MM-DD)
    """
    return obtener_citas_rango(profesional_id, inicio, fin)

@router.get("/paciente/{paciente_id}")
def obtener_historial_paciente(paciente_id: int):
    """
    Obtener todo el historial de citas de un paciente.
    """
    return obtener_citas_paciente_admin(paciente_id)

@router.get("/{cita_id}")
def get_cita(cita_id: int):
    return obtener_cita_id(cita_id)

@router.delete("/{cita_id}")
def eliminar_cita(cita_id: int):
    return eliminar_cita_control(cita_id)

class ObservacionRequest(BaseModel):
    observacion: str

@router.put("/{cita_id}/observacion")
def update_observacion(cita_id: int, body: ObservacionRequest):
    from app.control.citas_control import actualizar_observacion_control
    return actualizar_observacion_control(cita_id, body.observacion)
