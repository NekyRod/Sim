import requests

url = "http://localhost:8000/auth/token"
payload = {"username": "test", "password": "password"}
headers = {
    "Origin": "http://localhost:5173",
    "Content-Type": "application/json"
}

print(f"Sending POST to {url}...")
try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response Headers:")
    for k, v in response.headers.items():
        print(f"  {k}: {v}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")

print("\nSending OPTIONS to {url}...")
try:
    headers_opt = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type"
    }
    response = requests.options(url, headers=headers_opt)
    print(f"Status Code: {response.status_code}")
    print("Response Headers:")
    for k, v in response.headers.items():
        print(f"  {k}: {v}")
except Exception as e:
    print(f"Error: {e}")
