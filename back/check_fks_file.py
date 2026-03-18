import urllib.request
import json

base_url = "http://localhost:8001/patient-api"

data = {}

def get_data(endpoint, key):
    try:
        with urllib.request.urlopen(f"{base_url}{endpoint}") as response:
            data[key] = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        data[key] = str(e)

get_data("/tipos-servicio", "tipos_servicio")
get_data("/especialidades", "especialidades")

with open("fks.json", "w") as f:
    json.dump(data, f, indent=2)
