# app/routes/profesionales_routes.py

from fastapi import APIRouter, status, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.control import profesionales_control
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/profesionales",
    tags=["profesionales"],
    dependencies=[Depends(get_current_user_token)],
)

class ProfesionalRequest(BaseModel):
    nombre: str
    apellidos: str
    prenombre_id: Optional[int] = None
    tipo_identificacion: str
    numero_identificacion: str
    nit: Optional[str] = None
    correo: Optional[str] = None
    celular: Optional[str] = None
    telefono: Optional[str] = None
    nombre_completo: str
    ciudad: Optional[str] = None
    departamento: Optional[str] = None
    direccion: Optional[str] = None
    especialidad_id: Optional[int] = None
    estado_cuenta: Optional[str] = "Habilitada"
    activo: Optional[bool] = True
    especialidades_secundarias: Optional[List[int]] = []

@router.get("/")
def listar():
    return profesionales_control.listar_profesionales()

@router.get("/me")
def obtener_mi_perfil(token_payload: dict = Depends(get_current_user_token)):
    """
    Retorna el perfil del profesional vinculado al usuario de la sesión activa.
    Busca por numero_identificacion o correo usando el 'sub' (username) del JWT.
    """
    username = token_payload.get("sub")
    profesional = profesionales_control.obtener_profesional_por_identificacion(username)
    if not profesional:
         # Si no se encuentra vinculación, retornamos un error informativo o el admin por defecto
         raise HTTPException(
             status_code=status.HTTP_404_NOT_FOUND,
             detail=f"No se encontró un perfil profesional vinculado al usuario '{username}'"
         )
    return profesional

@router.get("/{profesional_id}")
def obtener(profesional_id: int):
    return profesionales_control.obtener_profesional_by_id(profesional_id)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear(body: ProfesionalRequest):
    return profesionales_control.crear_profesional(body.dict())

@router.put("/{profesional_id}")
def actualizar(profesional_id: int, body: ProfesionalRequest):
    return profesionales_control.actualizar_profesional(profesional_id, body.dict())

@router.delete("/{profesional_id}")
def eliminar(profesional_id: int):
    return profesionales_control.eliminar_profesional(profesional_id)

# ========== ESPECIALIDADES SECUNDARIAS ==========

@router.get("/{profesional_id}/especialidades-secundarias")
def obtener_especialidades_secundarias(profesional_id: int):
    return profesionales_control.obtener_especialidades_secundarias(profesional_id)

@router.post("/{profesional_id}/especialidades-secundarias/{especialidad_id}")
def agregar_especialidad_secundaria(profesional_id: int, especialidad_id: int):
    return profesionales_control.agregar_especialidad_secundaria(profesional_id, especialidad_id)

@router.delete("/{profesional_id}/especialidades-secundarias/{especialidad_id}")
def eliminar_especialidad_secundaria(profesional_id: int, especialidad_id: int):
    return profesionales_control.eliminar_especialidad_secundaria(profesional_id, especialidad_id)

# AGREGAR esta ruta en profesionales_routes.py

@router.get("/especialidad/{especialidad_codigo}")
def obtener_por_especialidad(especialidad_codigo: str):
    """Obtener profesionales filtrados por especialidad (código)"""
    return profesionales_control.listar_profesionales_por_especialidad(especialidad_codigo)
