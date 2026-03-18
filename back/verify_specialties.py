import requests
import json

BASE_URL = "http://localhost:8001" 

def test_patient_specialties():
    print(f"Testing {BASE_URL}/patient-api/especialidades ...")
    try:
        resp = requests.get(f"{BASE_URL}/patient-api/especialidades")
        if resp.status_code == 200:
            data = resp.json().get('data', [])
            print(f"Found {len(data)} specialties.")
            all_ok = True
            for s in data:
                print(f"- {s['nombre']} (Autogestion: {s['es_autogestion']})")
                if not s['es_autogestion']:
                    print("FAILURE: Found a specialty without autogestion enabled!")
                    all_ok = False
            if all_ok:
                print("SUCCESS: All returned specialties have autogestion enabled.")
        else:
            print(f"Error: {resp.status_code}")
            print(resp.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_patient_specialties()
