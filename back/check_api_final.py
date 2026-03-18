import urllib.request
import urllib.error
import json

url = "http://localhost:8001/patient-api/profesionales"
print(f"GET {url}")

try:
    with urllib.request.urlopen(url) as response:
        print(f"Status: {response.status}")
        data = json.loads(response.read().decode('utf-8'))
        print(f"Body: {str(data)[:200]}...")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} {e.reason}")
    print(f"Body: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
