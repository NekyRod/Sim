import urllib.request
import json

url = "http://localhost:8001/citas/"

# Payload mimicking the Frontend with valid codes found in fks.json
data = {
    "profesional_id": 1,
    "fecha_programacion": "2026-12-01",
    "fecha_solicitada": "2026-12-01",
    "hora": "14:00",
    "hora_fin": "14:20",
    "tipo_servicio": "PBS", # Valid Code
    "motivo_cita": "RES",   # Valid Specialty Code (Resina)
    "observacion": "Debug Script Creation",
    "mas_6_meses": False,
    "paciente": {
        "tipo_identificacion": "CC",
        "numero_identificacion": "9988776655", # Test ID
        "nombre_completo": "Debug Patient",
        "correo": "debug@test.com",
        "telefono_celular": "3000000000"
    }
}

print(f"Sending POST to {url} with:")
print(json.dumps(data, indent=2))

try:
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code}")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
