import urllib.request
import json

base_url = "http://localhost:8001/patient-api"

def get_data(endpoint):
    print(f"Checking {endpoint}...")
    try:
        with urllib.request.urlopen(f"{base_url}{endpoint}") as response:
            data = json.loads(response.read().decode('utf-8'))
            print(json.dumps(data, indent=2))
    except Exception as e:
        print(f"Error checking {endpoint}: {e}")

get_data("/tipos-servicio")
get_data("/especialidades")
