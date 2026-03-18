import urllib.request
import urllib.error

url = "http://localhost:8001/patient-api/profesionales"
print(f"GET {url}")

try:
    with urllib.request.urlopen(url) as response:
        print(f"Status: {response.status}")
        print(f"Body: {response.read().decode('utf-8')[:500]}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} {e.reason}")
    print(f"Body: {e.read().decode('utf-8')[:500]}")
except urllib.error.URLError as e:
    print(f"URL Error: {e.reason}")
except Exception as e:
    print(f"Error: {e}")
