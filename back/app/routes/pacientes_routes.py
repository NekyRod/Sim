# app/routes/pacientes_routes.py

from fastapi import APIRouter, status, Depends, Query
from pydantic import BaseModel
from datetime import date
from typing import Optional
from app.control import pacientes_control
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/pacientes",
    tags=["pacientes"],
    dependencies=[Depends(get_current_user_token)],
)

class PacienteRequest(BaseModel):
    tipo_identificacion: str
    numero_identificacion: str
    nombre_completo: str
    telefono_fijo: Optional[str] = None
    telefono_celular: Optional[str] = None
    segundo_telefono_celular: Optional[str] = None
    titular_segundo_celular: Optional[str] = None
    direccion: Optional[str] = None
    correo_electronico: Optional[str] = None
    lugar_residencia: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    tipo_doc_acompanante: Optional[str] = None
    nombre_acompanante: Optional[str] = None
    parentesco_acompanante: Optional[str] = None

class PacienteResponse(BaseModel):
    id: int
    tipo_identificacion: str
    numero_identificacion: str
    nombre_completo: str
    telefono_fijo: Optional[str] = None  # ← OPCIONAL
    telefono_celular: Optional[str] = None  # ← OPCIONAL
    segundo_telefono_celular: Optional[str] = None  # ← OPCIONAL
    titular_segundo_celular: Optional[str] = None  # ← OPCIONAL
    direccion: Optional[str] = None  # ← OPCIONAL
    correo_electronico: Optional[str] = None  # ← OPCIONAL
    lugar_residencia: Optional[str] = None  # ← OPCIONAL
    fecha_nacimiento: Optional[date] = None  # ← OPCIONAL
    tipo_doc_acompanante: Optional[str] = None  # ← AHORA OPCIONAL
    nombre_acompanante: Optional[str] = None  # ← AHORA OPCIONAL
    parentesco_acompanante: Optional[str] = None  # ← AHORA OPCIONAL

# ========== CRUD COMPLETO ==========

@router.get("/")
def listar():
    """Listar todos los pacientes activos"""
    return pacientes_control.listar_pacientes()

@router.get("/buscar")
def buscar_pacientes(q: str = Query(..., min_length=1)):  # ← CAMBIADO: min_length=1
    """Buscar pacientes por nombre o número de identificación"""
    return pacientes_control.buscar_pacientes(q)

@router.get("/{paciente_id}")
def obtener(paciente_id: int):
    """Obtener paciente por ID"""
    return pacientes_control.obtener_paciente_by_id(paciente_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: PacienteRequest):
    """Crear nuevo paciente"""
    return pacientes_control.crear_paciente(body.dict())

@router.put("/{paciente_id}")
def actualizar(paciente_id: int, body: PacienteRequest):
    """Actualizar paciente existente"""
    return pacientes_control.actualizar_paciente(paciente_id, body.dict())

@router.delete("/{paciente_id}")
def eliminar(paciente_id: int):
    """Eliminar paciente (soft delete)"""
    return pacientes_control.eliminar_paciente(paciente_id)

@router.get("/documento/{tipo_identificacion}/{numero_identificacion}",
            response_model=PacienteResponse | None)
def obtener_por_documento(tipo_identificacion: str, numero_identificacion: str):
    """
    Consultar paciente por tipo y número de identificación.
    Usado principalmente desde el módulo de citas.
    """
    return pacientes_control.obtener_paciente(tipo_identificacion, numero_identificacion)
