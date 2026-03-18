import requests
import json

AUTH_URL = "http://localhost:8000/auth/token"
API_URL = "http://localhost:8001/pacientes/"

def get_token():
    print(f"Authenticating with {AUTH_URL}...")
    try:
        response = requests.post(AUTH_URL, json={"username": "admin", "password": "admin"})
        if response.ok:
            return response.json().get("access_token")
        else:
            print(f"Auth failed: {response.text}")
            return None
    except Exception as e:
        print(f"Auth error: {e}")
        return None

def test_pacientes(token):
    print(f"\nTesting GET {API_URL}...")
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.get(API_URL, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.ok:
            data = response.json()
            print(f"✓ Success! Retrieved {len(data)} patients.")
            # print sample if available
            if data:
                print(f"Sample patient: {data[0].get('nombre_completo')}")
        else:
            print(f"✗ Failed: {response.text}")
            
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    token = get_token()
    if token:
        test_pacientes(token)
    else:
        print("Skipping backend test due to auth failure. (Check credentials or auth service)")
