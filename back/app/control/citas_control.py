# app/control/citas_control.py

from fastapi import HTTPException
from app.control.pacientes_control import upsert_paciente_desde_cita
from app.database import citas_repo

def crear_cita_control(body) -> dict:
    """
    Crear una nueva cita médica.
    
    1. Crea o actualiza el paciente (upsert)
    2. Valida que no exista una cita duplicada
    3. Inserta la cita en la base de datos
    """
    
    # 1. Upsert paciente (crear o actualizar)
    try:
        paciente_id = upsert_paciente_desde_cita(body)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar datos del paciente: {str(e)}"
        )
    
    # 2. Validar cita duplicada o superpuesta
    if body.hora_fin:
        existente = citas_repo.existe_cita(
            # Nota: existe_cita ahora verifica superposición y no requiere paciente_id
            # firma: (paciente_id, profesional_id, fecha_programacion, fecha_solicitada, hora_inicio, hora_fin)
            paciente_id, # Se requiere paciente_id aunque no se use en la query actual, para mantener la firma
            body.profesional_id,
            body.fecha_programacion,
            body.fecha_solicitada,
            body.hora,
            body.hora_fin
        )
    else:
        # Fallback si no hay hora_fin (no debería pasar con el nuevo front)
        # Podríamos calcularla si tuviéramos duración, pero por ahora asumimos 20 min o lanzamos error
        raise HTTPException(status_code=400, detail="Hora fin requerida para validación")

    if existente:
        fecha_prog = existente[1]
        hora_prog = existente[2]
        detalle = (
            f"El profesional ya tiene una cita asignada en el horario: "
            f"{fecha_prog} {hora_prog}"
        )
        raise HTTPException(status_code=400, detail=detalle)
    
    # 3. Insertar cita
    try:
        cita_id = citas_repo.insertar_cita(
            {
                "paciente_id": paciente_id,
                "profesional_id": body.profesional_id,
                "fecha_programacion": body.fecha_programacion,
                "fecha_solicitada": body.fecha_solicitada,
                "hora": body.hora,
                "hora_fin": body.hora_fin,
                "tipo_servicio": body.tipo_servicio,
                "tipo_pbs": getattr(body, 'tipo_pbs', None),
                "mas_6_meses": body.mas_6_meses,
                "motivo_cita": getattr(body, 'motivo_cita', None),
                "observacion": body.observacion,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la cita: {str(e)}"
        )
    
    return {
        "cita_id": cita_id,
        "paciente_id": paciente_id,
        "message": "Cita creada exitosamente"
    }

def obtener_citas_rango(profesional_id: int, fecha_inicio: str, fecha_fin: str):
    """
    Controlador para obtener citas en un rango.
    """
    citas = citas_repo.get_citas_profesional_rango(profesional_id, fecha_inicio, fecha_fin)
    return {"data": citas}

def obtener_cita_id(cita_id: int):
    """
    Obtener una cita por su ID.
    """
    cita = citas_repo.get_cita_by_id(cita_id)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return {"data": cita}

def eliminar_cita_control(cita_id: int):
    # Verificar si existe
    cita = citas_repo.get_cita_by_id(cita_id)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    deleted_count = citas_repo.delete_cita(cita_id)
    if deleted_count == 0:
        raise HTTPException(status_code=500, detail="No se pudo eliminar la cita")
    
    return {"message": "Cita eliminada correctamente"}
