# app/control/citas_control.py

from fastapi import HTTPException
from app.control.pacientes_control import upsert_paciente_desde_cita
from app.database import citas_repo, pacientes_repo, profesionales_repo, rangos_bloqueados_repo
from datetime import datetime


def crear_cita_control(body) -> dict:
    """
    Crear una nueva cita médica.
    
    1. Crea o actualiza el paciente (upsert)
    2. Valida que no exista una cita duplicada o superpuesta con un bloqueo
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
        
        if existente:
            fecha_prog = existente[1]
            hora_prog = existente[2]
            detalle = (
                f"El profesional ya tiene una cita asignada en el horario: "
                f"{fecha_prog} {hora_prog}"
            )
            raise HTTPException(status_code=400, detail=detalle)
            
        bloqueado = rangos_bloqueados_repo.existe_superposicion_bloqueo(
            body.profesional_id,
            body.fecha_programacion,
            body.hora,
            body.hora_fin
        )
        
        if bloqueado:
            detalle = "El profesional tiene un bloqueo de agenda en el horario seleccionado."
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
        with open("debug_citas_error.log", "w") as f:
            f.write(f"ERROR CREAR CITA: {e}\nPayload: {body}")
        print(f"ERROR CREAR CITA: {e}", flush=True)
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

def obtener_citas_paciente_admin(paciente_id: int):
    """
    Controlador para que el admin obtenga todo el historial de citas de un paciente.
    """
    citas = citas_repo.get_citas_paciente(paciente_id)
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

def cancelar_cita_control(cita_id: int, data: dict):
    # Verificar si existe
    try:
        print(f"DEBUG: Intentando cancelar cita_id={cita_id} con data={data}", flush=True)
        cita = citas_repo.get_cita_by_id(cita_id)
        if not cita:
            print(f"DEBUG: Cita {cita_id} no encontrada", flush=True)
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        
        cancelado_por_nombre = data.get("cancelado_por_nombre")
        cancelado_por_documento = data.get("cancelado_por_documento")
        cancelado_motivo = data.get("cancelado_motivo")

        if not cancelado_por_nombre or not cancelado_por_documento or not cancelado_motivo:
            print(f"DEBUG: Faltan datos: {cancelado_por_nombre}, {cancelado_por_documento}, {cancelado_motivo}", flush=True)
            raise HTTPException(status_code=400, detail="Nombre, documento y motivo son requeridos para cancelar")

        count = citas_repo.cancelar_cita_repo(
            cita_id, 
            cancelado_por_nombre, 
            cancelado_por_documento, 
            cancelado_motivo
        )
        
        if count == 0:
            print(f"DEBUG: No se afectaron filas al cancelar cita_id={cita_id}", flush=True)
            raise HTTPException(status_code=500, detail="No se pudo cancelar la cita")
        
        print(f"DEBUG: Cita {cita_id} cancelada exitosamente", flush=True)
        return {"message": "Cita cancelada correctamente"}
    except Exception as e:
        print(f"DEBUG ERROR CANCELAR: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

def buscar_citas_paciente_control(doc: str):
    """
    Busca todas las citas de un paciente por su documento.
    Solo retorna citas futuras o pendientes de realizar.
    """
    # 1. Buscar paciente por documento
    pats = pacientes_repo.buscar_pacientes(doc)
    if not pats:
        return {"data": []}
        
    paciente_id = pats[0]['id']
    
    # 2. Obtener citas del paciente usando el método optimizado del repositorio
    citas = citas_repo.get_citas_paciente(paciente_id)
    
    # 3. Filtrar por fecha (solo futuras)
    now = datetime.now()
    future = []
    
    for c in citas:
        try:
            dt_str = f"{c['fecha_programacion']} {c['hora']}"
            try:
                c_dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                c_dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
                
            if c_dt > now:
                future.append(c)
        except Exception:
            # En caso de error de parseo, lo incluimos por seguridad si el estado no es cancelado
            future.append(c)
                
    return {"data": future}


def confirmar_cita_control(cita_id: int):
    # Update status
    # Check if exists
    cita = citas_repo.get_cita_by_id(cita_id)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
        
    citas_repo.update_cita_estado(cita_id, "CONFIRMADA")
    return {"message": "Cita confirmada"}

def actualizar_observacion_control(cita_id: int, observacion: str):
    cita = citas_repo.get_cita_by_id(cita_id)
    if not cita:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    citas_repo.update_cita_observacion(cita_id, observacion)
    return {"message": "Observación actualizada correctamente"}
