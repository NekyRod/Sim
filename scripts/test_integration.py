import requests
import sys

FRONTEND_URL = "http://localhost:5175"
AUTH_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:8001"

USER = "admin"
PASS = "password123"

def test_integration():
    print("=== TEST DE INTEGRACIÓN ===")
    
    # 1. Frontend Up?
    print(f"\n1. Probando Frontend en {FRONTEND_URL}...")
    try:
        resp = requests.get(FRONTEND_URL)
        if resp.status_code == 200:
            print(f"[PASS] Frontend responde 200 OK.")
        else:
            print(f"[WARN] Frontend respondió {resp.status_code}")
    except Exception as e:
        print(f"[FAIL] Frontend no accesible: {e}")

    # 2. Login (Auth Service)
    print(f"\n2. Probando Login en {AUTH_URL}/auth/token...")
    token = None
    try:
        payload = {"username": USER, "password": PASS}
        # Auth service endpoint expects JSON based on my previous analysis?
        # Or Form Data?
        # Let's try JSON first as per frontend code.
        resp = requests.post(f"{AUTH_URL}/auth/token", json=payload)
        
        if resp.status_code == 200:
            data = resp.json()
            token = data.get("access_token")
            print(f"[PASS] Login exitoso. Token recibido.")
        else:
            print(f"[FAIL] Login falló: {resp.status_code} - {resp.text}")
            # Try Form Data if JSON fails (FastAPI standard)
            # But frontend uses JSON, so I expect JSON.
            
    except Exception as e:
        print(f"[FAIL] Error en Login: {e}")
        return

    if not token:
        print("No hay token, abortando pruebas de backend.")
        return

    # 3. Backend Protected Route
    print(f"\n3. Probando Backend Protected Route {BACKEND_URL}/profesionales/...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BACKEND_URL}/profesionales/", headers=headers)
        
        if resp.status_code == 200:
            print(f"[PASS] Backend autorizó correctamente. Datos recibidos: {len(resp.json())} registros.")
        else:
            print(f"[FAIL] Backend rechazó token: {resp.status_code} - {resp.text}")
            
    except Exception as e:
        print(f"[FAIL] Error conectando al Backend: {e}")

if __name__ == "__main__":
    test_integration()
