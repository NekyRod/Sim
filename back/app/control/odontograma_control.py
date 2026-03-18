# app/control/odontograma_control.py

from fastapi import HTTPException, status
from app.database import odontograma_repo

def get_procedimientos_control():
    procedimientos = odontograma_repo.get_procedimientos()
    return {"data": procedimientos}

def get_paciente_timeline_control(paciente_id: int):
    """
    Obtiene la línea de tiempo oficial (solo registros FINALIZADOS) del paciente.
    """
    historiales = odontograma_repo.get_timeline_by_paciente(paciente_id)
    return {"data": historiales}

def autoguardar_evaluacion_control(evaluacion_id: str, body):
    """
    Endpoint del Debounce. Recibe el Borrador actual,
    evalúa reglas médicas y ejecuta el upsert.
    """
    paciente_id = body.paciente_id
    profesional_id = body.profesional_id
    registrado_por = body.registrado_por
    detalles = body.detalles
    
    # REGLA MÉDICA 1: Validar Dientes Extraídos Históricamente
    dientes_extraidos_historicos = odontograma_repo.get_dientes_extraidos_paciente(paciente_id)
    
    # Convertimos pydantic objects a diccionarios si no lo son
    detalles_dicts = []
    for d in detalles:
        # Pydantic v2
        d_dict = d.dict() if hasattr(d, "dict") else d
        
        if d_dict["pieza_dental"] in dientes_extraidos_historicos:
            raise HTTPException(
                status_code=400,
                detail=f"Inconsistencia Clínica: El diente {d_dict['pieza_dental']} ya fue extraído en una cita anterior."
            )
        detalles_dicts.append(d_dict)

    # Si supera todas las barreras, persistimos el draft
    try:
        odontograma_repo.actualizar_draft(
            evaluacion_id=evaluacion_id,
            paciente_id=paciente_id,
            profesional_id=profesional_id,
            detalles_data=detalles_dicts,
            registrado_por=registrado_por
        )
        return {"message": "Borrador guardado exitosamente."}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        # Log error in production
        print(f"Error autoguardando odontograma: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="Error del sistema al persistir el borrador del odontograma."
        )

def eliminar_odontograma_control(evaluacion_id: str):
    """
    Controlador para eliminación física de un registro.
    """
    try:
        odontograma_repo.eliminar_odontograma(evaluacion_id)
        return {"message": "Registro eliminado permanentemente."}
    except Exception as e:
        print(f"Error en eliminar_odontograma_control: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Error interno al eliminar el registro.")

def finalizar_evaluacion_control(evaluacion_id: str):
    """
    Sella la evaluación médica (Pasa de DRAFT a FINALIZADO).
    Añade validación para evitar guardar si no hay cambios significativos 
    respecto al historial previo (opcional, según requerimiento).
    """
    try:
        # Aquí se podría implementar una comparación para evitar "Finalizar" 
        # odontogramas vacíos o idénticos al anterior si fuera necesario.
        # Por ahora procederemos a cerrar el draft existente.
        
        registro_id = odontograma_repo.finalizar_evaluacion(evaluacion_id)
        return {"message": "Odontograma finalizado y anexado exitosamente al historial clínico.", "id": registro_id}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Error finalizando odontograma: {e}", flush=True)
        raise HTTPException(
            status_code=500,
            detail="Fallo crítico al intentar sellar la historia clínica."
        )
