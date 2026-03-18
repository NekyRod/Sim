from app.database import alertas_repo
from fastapi import HTTPException

# Models
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertaCreateRequest(BaseModel):
    paciente_id: int
    tipo: str
    texto: str

def crear_alerta_control(data: AlertaCreateRequest, user_id: int = None):
    try:
        if not data.texto or not data.tipo:
            raise HTTPException(status_code=400, detail="Faltan datos requeridos (tipo, texto)")
            
        print(f"DEBUG ALERTAS: Creando alerta {data.tipo} para paciente {data.paciente_id}")
        nuevo_id = alertas_repo.crear_alerta(
            paciente_id=data.paciente_id,
            tipo=data.tipo,
            texto=data.texto,
            created_by=user_id
        )
        return {"message": "Alerta creada", "id": nuevo_id}
    except Exception as e:
        print(f"DEBUG ALERTAS ERROR: {e}")
        raise HTTPException(status_code=500, detail="Error creando alerta")

def obtener_alertas_activas_control():
    try:
        alertas = alertas_repo.get_alertas_activas()
        return {"data": alertas}
    except Exception as e:
        print(f"DEBUG ALERTAS ERROR: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo alertas activas")

def obtener_alertas_paciente_control(paciente_id: int):
    try:
        alertas = alertas_repo.get_alertas_por_paciente(paciente_id)
        return {"data": alertas}
    except Exception as e:
        print(f"DEBUG ALERTAS ERROR: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo alertas del paciente")

def desactivar_alerta_control(alerta_id: int):
    try:
        count = alertas_repo.desactivar_alerta(alerta_id)
        if count == 0:
            raise HTTPException(status_code=404, detail="Alerta no encontrada")
        return {"message": "Alerta desactivada"}
    except Exception as e:
        print(f"DEBUG ALERTAS ERROR: {e}")
        raise HTTPException(status_code=500, detail="Error desactivando alerta")
