# app/control/pacientes_control.py

from fastapi import HTTPException
from app.database import pacientes_repo

def listar_pacientes():
    """Listar todos los pacientes activos"""
    pacientes = pacientes_repo.get_all_pacientes()
    return {"data": pacientes}

def buscar_pacientes(termino: str):  # ← NUEVA FUNCIÓN
    """Buscar pacientes por nombre o número de identificación"""
    pacientes = pacientes_repo.buscar_pacientes(termino)
    return {"data": pacientes}

def obtener_paciente_by_id(paciente_id: int):
    """Obtener paciente por ID"""
    paciente = pacientes_repo.get_paciente_by_id(paciente_id)
    if not paciente:
        raise HTTPException(
            status_code=404, 
            detail=f"Paciente con ID {paciente_id} no encontrado"
        )
    return paciente

def crear_paciente(data: dict):
    """Crear nuevo paciente"""
    if not data.get("tipo_identificacion"):
        raise HTTPException(
            status_code=400, 
            detail="El tipo de identificación es obligatorio"
        )
    
    if not data.get("numero_identificacion"):
        raise HTTPException(
            status_code=400, 
            detail="El número de identificación es obligatorio"
        )
    
    if not data.get("nombre_completo"):
        raise HTTPException(
            status_code=400, 
            detail="El nombre del paciente es obligatorio"
        )
    
    try:
        paciente_id = pacientes_repo.create_paciente(data)
        return {
            "id": paciente_id, 
            "message": "Paciente creado correctamente"
        }
    except Exception as e:
        error_msg = str(e).lower()
        if "unique" in error_msg or "duplicate" in error_msg:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un paciente con el documento {data['tipo_identificacion']} {data['numero_identificacion']}"
            )
        raise HTTPException(status_code=500, detail=str(e))

def actualizar_paciente(paciente_id: int, data: dict):
    """Actualizar paciente existente"""
    if not data.get("tipo_identificacion"):
        raise HTTPException(
            status_code=400, 
            detail="El tipo de identificación es obligatorio"
        )
    
    if not data.get("numero_identificacion"):
        raise HTTPException(
            status_code=400, 
            detail="El número de identificación es obligatorio"
        )
    
    if not data.get("nombre_completo"):
        raise HTTPException(
            status_code=400, 
            detail="El nombre del paciente es obligatorio"
        )
    
    try:
        rows = pacientes_repo.update_paciente(paciente_id, data)
        if rows == 0:
            raise HTTPException(
                status_code=404, 
                detail=f"Paciente con ID {paciente_id} no encontrado"
            )
        return {"message": "Paciente actualizado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def eliminar_paciente(paciente_id: int):
    """Eliminar paciente (soft delete)"""
    try:
        rows = pacientes_repo.delete_paciente(paciente_id)
        if rows == 0:
            raise HTTPException(
                status_code=404, 
                detail=f"Paciente con ID {paciente_id} no encontrado"
            )
        return {"message": "Paciente eliminado correctamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ========================================================
# FUNCIONES PARA COMPATIBILIDAD CON MÓDULO DE CITAS
# ========================================================

def upsert_paciente_desde_cita(body) -> int:
    """
    Recibe el body de la cita y devuelve paciente_id.
    Si el paciente existe, actualiza sus datos.
    Si no existe, lo crea.
    Utilizado desde el módulo de citas.
    """
    paciente = pacientes_repo.obtener_paciente_por_doc(
        body.tipo_identificacion, 
        body.numero_identificacion
    )
    
    if paciente:
        paciente_id = paciente[0]
        pacientes_repo.actualizar_paciente(
            paciente_id,
            {
                "telefono_fijo": body.telefono_fijo,
                "telefono_celular": body.telefono_celular,
                "segundo_telefono_celular": getattr(body, 'segundo_telefono_celular', None),
                "titular_segundo_celular": getattr(body, 'titular_segundo_celular', None),
                "direccion": body.direccion,
                "correo_electronico": body.correo_electronico,
                "lugar_residencia": body.lugar_residencia,
                "fecha_nacimiento": body.fecha_nacimiento,
            },
        )
    else:
        paciente_id = pacientes_repo.insertar_paciente(
            {
                "tipo_identificacion": body.tipo_identificacion,
                "numero_identificacion": body.numero_identificacion,
                "nombre_paciente": body.nombre_paciente,
                "telefono_fijo": body.telefono_fijo,
                "telefono_celular": body.telefono_celular,
                "segundo_telefono_celular": getattr(body, 'segundo_telefono_celular', None),
                "titular_segundo_celular": getattr(body, 'titular_segundo_celular', None),
                "direccion": body.direccion,
                "correo_electronico": body.correo_electronico,
                "lugar_residencia": body.lugar_residencia,
                "fecha_nacimiento": body.fecha_nacimiento,
            }
        )
    
    return paciente_id

def obtener_paciente(tipo_identificacion: str, numero_identificacion: str):
    """
    Obtener paciente por tipo y número de documento.
    Utilizado principalmente desde el módulo de citas.
    """
    row = pacientes_repo.obtener_paciente_por_doc(
        tipo_identificacion, 
        numero_identificacion
    )
    
    if not row:
        return None
    
    # ← AJUSTADO: manejar correctamente los índices de la tupla
    return {
        "id": row[0],
        "tipo_identificacion": row[1],
        "numero_identificacion": row[2],
        "nombre_completo": row[3],
        "telefono_fijo": row[4] if len(row) > 4 else None,
        "telefono_celular": row[5] if len(row) > 5 else None,
        "segundo_telefono_celular": row[6] if len(row) > 6 else None,
        "titular_segundo_celular": row[7] if len(row) > 7 else None,
        "direccion": row[8] if len(row) > 8 else None,
        "correo_electronico": row[9] if len(row) > 9 else None,
        "lugar_residencia": row[10] if len(row) > 10 else None,
        "fecha_nacimiento": str(row[11]) if (len(row) > 11 and row[11]) else None,
        "tipo_doc_acompanante": row[12] if len(row) > 12 else None,  # ← NUEVO
        "nombre_acompanante": row[13] if len(row) > 13 else None,  # ← NUEVO
        "parentesco_acompanante": row[14] if len(row) > 14 else None,  # ← NUEVO
    }