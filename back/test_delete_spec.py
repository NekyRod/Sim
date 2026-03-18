import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.control import especialidades_control

# 1. Create dummy
data = {"codigo": "TEST_DEL", "nombre": "Test Delete", "activo": True}
try:
    print("Creating specialty...")
    res = especialidades_control.crear_especialidad(data)
    new_id = res['id']
    print(f"Created ID: {new_id}")

    # 2. Check active
    spec = especialidades_control.obtener_especialidad_by_id(new_id)
    print(f"Status before delete: {spec['activo']}")

    # 3. Delete
    print("Deleting...")
    especialidades_control.eliminar_especialidad(new_id)
    
    # 4. Check active again
    spec = especialidades_control.obtener_especialidad_by_id(new_id)
    print(f"Status after delete: {spec['activo']}")
    
    # Cleanup (Hard delete manually if needed or leave as inactive)
    # We leave it as is to confirm soft delete works.
    
except Exception as e:
    print("Error:", e)
    import traceback
    traceback.print_exc()
