import urllib.request
import urllib.error
import json

base_url = "http://localhost:8001/patient-api"

def test_get(endpoint):
    print(f"GET {endpoint}")
    try:
        url = f"{base_url}{endpoint}"
        with urllib.request.urlopen(url) as response:
            print(f"Status: {response.status}")
            data = json.loads(response.read().decode('utf-8'))
            print(f"Data: {str(data)[:200]}...")
            return data
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} {e.reason}")
        print(f"Body: {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error: {e}")

print("--- Testing Tipos Servicio ---")
test_get("/tipos-servicio")

print("\n--- Testing Disponibilidades (ID 1) ---")
test_get("/disponibilidades/profesional/1")
