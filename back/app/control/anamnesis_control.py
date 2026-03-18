
from fastapi import HTTPException
from app.database import anamnesis_repo

def get_anamnesis_control(paciente_id: int):
    anamnesis = anamnesis_repo.get_anamnesis_by_paciente(paciente_id)
    if not anamnesis:
        # Return empty structure instead of 404 to simplify frontend
        return {
            "paciente_id": paciente_id,
            "antece_medicos": {},
            "observaciones": "",
            "motivo_consulta": "",
            "escala_dolor": 0,
            "cie10_codigo": "",
            "cie10_texto": ""
        }
    return anamnesis

def upsert_anamnesis_control(paciente_id: int, body):
    # body is expected to be Pydantic model
    try:
        registrado_por = getattr(body, 'registrado_por', None)
        id = anamnesis_repo.upsert_anamnesis(
            paciente_id, 
            body.antece_medicos, 
            body.observaciones,
            body.motivo_consulta,
            body.escala_dolor,
            body.cie10_codigo,
            body.cie10_texto,
            registrado_por
        )
        return {"id": id, "message": "Anamnesis guardada correctamente"}
    except Exception as e:
        print(f"Error saving anamnesis: {e}")
        raise HTTPException(status_code=500, detail="Error al guardar anamnesis")
