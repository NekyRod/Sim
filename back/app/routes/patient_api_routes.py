from fastapi import APIRouter, status, HTTPException, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import date, time

from app.control import profesionales_control, citas_control, disponibilidades_control, tiposservicio_control, especialidades_control

router = APIRouter(
    prefix="/patient-api",  # Different from /patient/chat
    tags=["patient-api"],
)
print("LOADING PATIENT API ROUTES...", flush=True)

@router.get("/")
def patient_api_root():
    return {"message": "Patient API is working"}

# --- MODELS (Duplicated/Imported to avoid circular deps or just define what's needed) ---


# --- PROFESSIONALS ---
@router.get("/profesionales")
def listar_profesionales(especialidad: Optional[str] = None):
    """Public list of professionals for scheduling, optionally filtered by specialty code"""
    if especialidad:
        return profesionales_control.listar_profesionales_por_especialidad(especialidad)
    return profesionales_control.listar_profesionales()

@router.get("/especialidades")
def listar_especialidades():
    """Public list of specialties (for 'Motivo de Cita')"""
    return especialidades_control.listar_especialidades(solo_activos=True, solo_autogestion=True)

@router.get("/tipos-servicio")
def listar_tipos_servicio():
    """Public list of service types (Motivos)"""
    return tiposservicio_control.listar_tipos_servicio()

# --- APPOINTMENTS ---
class CitaRequest(BaseModel):
    tipo_identificacion: str
    numero_identificacion: str
    nombre_paciente: str
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
    profesional_id: int
    fecha_programacion: date
    fecha_solicitada: date
    hora: time
    hora_fin: Optional[time] = None
    tipo_servicio: str
    tipo_pbs: Optional[str] = None
    mas_6_meses: bool = False
    motivo_cita: Optional[str] = None
    observacion: Optional[str] = None

class CancellationRequest(BaseModel):
    cancelado_por_nombre: str
    cancelado_por_documento: str
    cancelado_motivo: str

@router.post("/citas", status_code=status.HTTP_201_CREATED)
def crear_cita_publica(body: CitaRequest):
    """Public endpoint to create appointments via Chat"""
    return citas_control.crear_cita_control(body)

# --- AVAILABILITY ---
@router.get("/disponibilidades/profesional/{profesional_id}")
def get_disponibilidad(profesional_id: int):
    """Public availability rules"""
    return disponibilidades_control.obtener_disponibilidades_profesional(profesional_id)

@router.get("/rangos-bloqueados/rango")
def get_rangos_bloqueados_public(profesional_id: int = Query(...), inicio: str = Query(...), fin: str = Query(...)):
    """Public blocked ranges"""
    from app.control import rangos_bloqueados_control
    return rangos_bloqueados_control.obtener_rangos_bloqueados_rango(profesional_id, inicio, fin)

@router.get("/citas/profesional/{profesional_id}/rango")
def get_citas_occupied(profesional_id: int, inicio: date, fin: date):
    """Public occupied slots"""
    return citas_control.obtener_citas_rango(profesional_id, inicio, fin)



@router.get("/citas/buscar")
def buscar_citas_public(doc: str):
    """Public search by document"""
    return citas_control.buscar_citas_paciente_control(doc)

@router.put("/citas/{cita_id}/confirmar")
def confirmar_cita_public(cita_id: int):
    """Public confirm"""
    return citas_control.confirmar_cita_control(cita_id)

@router.delete("/citas/{cita_id}")
def cancelar_cita_public(cita_id: int):
    """Obsolete: Use the PUT /cancelar instead if details are needed, but keeping for compatibility if simple delete is used."""
    return citas_control.eliminar_cita_control(cita_id)

@router.put("/citas/{cita_id}/cancelar")
def cancelar_cita_detalle_public(cita_id: int, body: CancellationRequest):
    """Public cancel with details"""
    return citas_control.cancelar_cita_control(cita_id, body.dict())
