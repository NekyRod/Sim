
import sys
import os
import json

# Ensure we are in the back directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.getcwd())

from app.database import anamnesis_repo

def test_save():
    paciente_id = 1
    antece_medicos = {
        "enfermedad_actual": "Prueba",
        "patologicos": "",
        "farmacologicos": "",
        "odontologicos": ""
    }
    observaciones = "Prueba obs"
    motivo_consulta = "Dolor"
    escala_dolor = 5
    cie10_codigo = "K021"
    cie10_texto = "Caries de la dentina"
    registrado_por = "admin"
    
    print(f"Attempting to save anamnesis for patient {paciente_id}...")
    try:
        result_id = anamnesis_repo.upsert_anamnesis(
            paciente_id,
            antece_medicos,
            observaciones,
            motivo_consulta,
            escala_dolor,
            cie10_codigo,
            cie10_texto,
            registrado_por
        )
        print(f"SUCCESS! Saved with ID: {result_id}")
    except Exception as e:
        print(f"FAILED with error: {repr(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_save()
