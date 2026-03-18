import os
import sys

# Add app to path
sys.path.append(os.getcwd())

from app.control import especialidades_control
from app.services.user_service import UserService

def verify_especialidades():
    print("Checking especialidades (default: solo_activos=True)...")
    # Note: the route now defaults to solo_activos=True, but we'll call the control with it
    res = especialidades_control.listar_especialidades(solo_activos=True)
    data = res.get('data', [])
    inactive = [e for e in data if not e.get('activo')]
    if inactive:
        print(f"FAILURE: Found {len(inactive)} inactive specialties in active list.")
        for e in inactive:
            print(f" - {e['nombre']} (ID: {e['id']})")
    else:
        print("SUCCESS: No inactive specialties found in list.")

def verify_users():
    print("\nChecking users (should return only active)...")
    users = UserService.get_all_users()
    inactive = [u for u in users if not u.get('activo')]
    if inactive:
        print(f"FAILURE: Found {len(inactive)} inactive users in list.")
        for u in inactive:
            print(f" - {u['username']} (ID: {u['id']})")
    else:
        print("SUCCESS: No inactive users found in list.")

if __name__ == "__main__":
    verify_especialidades()
    verify_users()
