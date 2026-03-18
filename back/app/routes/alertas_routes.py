from fastapi import APIRouter, status, Depends
from app.control.alertas_control import (
    crear_alerta_control,
    obtener_alertas_activas_control,
    obtener_alertas_paciente_control,
    desactivar_alerta_control,
    AlertaCreateRequest
)
from app.config.security import get_current_user_token

router = APIRouter(
    prefix="/alertas",
    tags=["alertas"]
    # Dependencies check later if needed
)

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_alerta(body: AlertaCreateRequest):
    return crear_alerta_control(body, user_id=None) # user_id handled by auth token if implemented

@router.get("/")
def obtener_alertas_activas():
    return obtener_alertas_activas_control()

@router.get("/paciente/{paciente_id}")
def obtener_alertas_paciente(paciente_id: int):
    return obtener_alertas_paciente_control(paciente_id)

@router.put("/{alerta_id}/desactivar")
def desactivar_alerta(alerta_id: int):
    return desactivar_alerta_control(alerta_id)
