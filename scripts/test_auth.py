import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_auth():
    print("Iniciando pruebas del Auth Service...")
    
    # 1. Validar /docs (Health Check básico)
    try:
        resp = requests.get(f"{BASE_URL}/docs")
        if resp.status_code == 200:
            print("[PASS] /docs carga correctamente.")
        else:
            print(f"[FAIL] /docs retornó {resp.status_code}")
            return
    except Exception as e:
        print(f"[FAIL] No se pudo conectar a {BASE_URL}: {e}")
        return

    # 2. Validar POST /auth/token (aunque falle login, valida que el endpoint responda)
    try:
        # Intentamos login con credenciales falsas
        payload = {"username": "fake", "password": "fake"}
        resp = requests.post(f"{BASE_URL}/auth/token", json=payload)
        
        if resp.status_code == 401:
            print("[PASS] /auth/token responde correctamente (401 Credenciales inválidas).")
            # Esto confirma que llegó a la DB y no encontró el usuario
        elif resp.status_code == 200:
            print("[WARN] /auth/token retornó 200 con credenciales falsas?!")
        else:
            print(f"[FAIL] /auth/token retornó {resp.status_code}")
            print("Response:", resp.text)
    except Exception as e:
        print(f"[FAIL] Error consultando /auth/token: {e}")

if __name__ == "__main__":
    test_auth()
