import requests
import sys

BASE_URL = "http://127.0.0.1:8001"

def test_backend():
    print("Iniciando pruebas de validación del backend...")
    
    # 1. Validar /docs
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

    # 2. Validar /profesionales (Usa relación con prenombres y especialidades)
    try:
        resp = requests.get(f"{BASE_URL}/profesionales/")
        if resp.status_code == 200:
            data = resp.json()
            # Esperamos que sea una lista (o un dict con 'data')
            if isinstance(data, dict) and 'data' in data:
                print(f"[PASS] /profesionales retornó 200 y {len(data['data'])} registros.")
            elif isinstance(data, list):
                print(f"[PASS] /profesionales retornó 200 y {len(data)} registros.")
            else:
                print(f"[WARN] /profesionales retornó 200 pero formato inesperado: {type(data)}")
        else:
            print(f"[FAIL] /profesionales retornó {resp.status_code}")
            print("Response:", resp.text)
    except Exception as e:
        print(f"[FAIL] Error consultando /profesionales: {e}")

    # 3. Validar /citas (Usa muchas relaciones)
    try:
        # Probamos listar todas las citas
        # Nota: Revisar si existe endpoint get_all_citas en rutas
        # En citas_routes.py vimos router.get("/") -> listar_citas()
        resp = requests.get(f"{BASE_URL}/citas/")
        if resp.status_code == 200:
            data = resp.json()
            count = len(data.get('data', [])) if isinstance(data, dict) else len(data)
            print(f"[PASS] /citas retornó 200 y {count} registros.")
        else:
            print(f"[FAIL] /citas retornó {resp.status_code}")
            print("Response:", resp.text)
    except Exception as e:
        print(f"[FAIL] Error consultando /citas: {e}")

if __name__ == "__main__":
    test_backend()
