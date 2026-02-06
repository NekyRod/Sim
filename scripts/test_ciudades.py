import requests
import sys

AUTH_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:8001"

USER = "admin"
PASS = "password123"

def test_ciudades():
    print("=== TEST CIUDADES ===")
    
    # Login
    try:
        payload = {"username": USER, "password": PASS}
        resp = requests.post(f"{AUTH_URL}/auth/token", json=payload)
        
        if resp.status_code == 200:
            token = resp.json().get("access_token")
            print(f"[PASS] Token recibido.")
        else:
            print(f"[FAIL] Login falló: {resp.status_code}")
            return
            
    except Exception as e:
        print(f"[FAIL] Error en Login: {e}")
        return

    # Hit Ciudades
    print(f"\nProbando {BACKEND_URL}/ciudadesresidencia/...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BACKEND_URL}/ciudadesresidencia/", headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"[PASS] Ciudades recibidas: {len(data['data'])} registros.")
        else:
            print(f"[FAIL] Backend Ciudades error: {resp.status_code} - {resp.text}")
            
    except Exception as e:
        print(f"[FAIL] Error conectando al Backend (Ciudades): {e}")

    # Hit Profesionales (Control)
    print(f"\nProbando {BACKEND_URL}/profesionales/...")
    try:
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BACKEND_URL}/profesionales/", headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            print(f"[PASS] Profesionales recibidos: {len(data['data'])} registros.")
        else:
            print(f"[FAIL] Backend Profesionales error: {resp.status_code} - {resp.text}")
            
    except Exception as e:
        print(f"[FAIL] Error conectando al Backend (Profesionales): {e}")

if __name__ == "__main__":
    test_ciudades()
