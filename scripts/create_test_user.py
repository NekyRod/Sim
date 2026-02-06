import requests
import sys

AUTH_URL = "http://localhost:8000"

def create_user():
    print(f"Intentando crear usuario 'admin' en {AUTH_URL}...")
    
    payload = {
        "username": "admin",
        "password": "password123",
        "rol": "ADMIN",
        "activo": True
    }
    
    try:
        # Check if user exists first (optional, but good practice)
        # The endpoint POST /users checks internally and returns 400 if exists.
        
        resp = requests.post(f"{AUTH_URL}/users", json=payload)
        
        if resp.status_code == 200:
            print("[SUCCESS] Usuario 'admin' creado exitosamente.")
            print(resp.json())
        elif resp.status_code == 400 and "ya existe" in resp.text:
            print("[INFO] El usuario 'admin' ya existe.")
        else:
            print(f"[FAIL] Error creando usuario: {resp.status_code}")
            print(resp.text)
            
    except Exception as e:
        print(f"[ERROR] No se pudo conectar a {AUTH_URL}: {e}")

if __name__ == "__main__":
    create_user()
