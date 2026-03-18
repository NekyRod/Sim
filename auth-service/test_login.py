import requests
import json

url = "http://localhost:8000/auth/token"
payload = {"username": "admin", "password": "admin"}

print(f"Testing POST {url}")
print(f"Payload: {payload}")
print()

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    print(f"Response Body: {response.text}")
    
    if response.ok:
        data = response.json()
        print(f"\n✓ Login successful!")
        print(f"Access Token: {data.get('access_token')[:50]}...")
        print(f"Role: {data.get('role')}")
    else:
        print(f"\n✗ Login failed!")
        
except Exception as e:
    print(f"\n✗ Error: {e}")
