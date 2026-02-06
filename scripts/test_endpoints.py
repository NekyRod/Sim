import requests
import sys

AUTH_URL = "http://localhost:8000"
BACKEND_URL = "http://localhost:8001"

USER = "admin"
PASS = "password123"

def test_endpoints():
    print("=== TEST ENDPOINTS ===")
    
    # Login
    token = None
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

    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        "especialidades",
        "festivos",
        "profesionales",
        "prenombres"
    ]

    for ep in endpoints:
        print(f"\nProbando {BACKEND_URL}/{ep}/...")
        try:
            resp = requests.get(f"{BACKEND_URL}/{ep}/", headers=headers)
            
            if resp.status_code == 200:
                data = resp.json()
                # Assuming standard response format list or dict with 'data' key
                count = 0
                if isinstance(data, list):
                    count = len(data)
                elif isinstance(data, dict) and 'data' in data:
                    count = len(data['data'])
                elif isinstance(data, dict): # maybe just a dict response
                     count = 1
                
                print(f"[PASS] {ep}: {resp.status_code} OK. Items: {count}")
            else:
                print(f"[FAIL] {ep}: {resp.status_code} - {resp.text}")
                
        except Exception as e:
            print(f"[FAIL] Error conectando a {ep}: {e}")

if __name__ == "__main__":
    test_endpoints()
