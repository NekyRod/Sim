import requests

url = "http://localhost:8002/patient-api/citas/1/cancelar"
payload = {
    "cancelado_por_nombre": "Test",
    "cancelado_por_documento": "123",
    "cancelado_motivo": "Prueba"
}

try:
    response = requests.put(url, json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
