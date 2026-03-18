import sys
import os

# Add project root to path
sys.path.append(os.getcwd())

from app.database import pacientes_repo

def test_lookup():
    print("Testing patient lookup...")
    # Try to find a patient. 
    # We can try to list all and pick one, or search if we know one.
    # Let's list top 1
    pats = pacientes_repo.get_all_pacientes()
    if not pats:
        print("No patients found in DB.")
        return

    target_id = pats[0]['id']
    print(f"Testing lookup for ID: {target_id}")
    
    p = pacientes_repo.get_paciente_by_id(target_id)
    if p:
        print(f"SUCCESS: Found patient {p['nombre_completo']} with doc {p['numero_identificacion']}")
    else:
        print("FAILURE: create_paciente_by_id returned None")

if __name__ == "__main__":
    test_lookup()
