import sys
import os

# Add relevant paths
sys.path.append(os.getcwd())

try:
    from app.control import chat_control
    from app.database import especialidades_repo
    print("SUCCESS: chat_control and especialidades_repo imported correctly.")
    
    # Check if we can list specialties
    specs = especialidades_repo.listar_especialidades(solo_activos=True)
    print(f"Found {len(specs)} specialties.")
    auto_specs = [s for s in specs if s.get('es_autogestion')]
    print(f"Autogestion specialties: {[s['nombre'] for s in auto_specs]}")

except Exception as e:
    import traceback
    print("ERROR detected:")
    traceback.print_exc()
