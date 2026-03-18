import urllib.request
import json

url = "http://localhost:8001/citas/"

# Data based on frontend payload
data = {
    "profesional_id": 1, # Assuming 1 exists
    "fecha_programacion": "2024-12-01",
    "fecha_solicitada": "2024-12-01",
    "hora": "10:00",
    "hora_fin": "10:20",
    "tipo_servicio": "ODONTOLOGIA", # SUSPECT
    "motivo_cita": "GEN", # Guessing 'GEN' or 'ODONTOLOGIA' code for General Dentistry
    "observacion": "Test simulation",
    "mas_6_meses": False,
    "paciente": {
        "tipo_identificacion": "CC",
        "numero_identificacion": "123456789",
        "nombre_completo": "Test Patient",
        "correo": "test@example.com",
        "telefono_celular": "3001234567"
    }
}

def send_post(payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
    print(f"POST {url} with tipo_servicio={payload['tipo_servicio']}")
    try:
        with urllib.request.urlopen(req) as response:
            print(f"Status: {response.status}")
            print(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(e.read().decode('utf-8'))
    except Exception as e:
        print(f"Error: {e}")

# Test 1: ODONTOLOGIA
send_post(data)

# Test 2: PBS (Known valid from check_fks)
data["tipo_servicio"] = "PBS"
send_post(data)
