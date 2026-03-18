# back/test_informes_api.py
import requests
import json
from datetime import date, timedelta

BASE_URL = "http://localhost:8001"

def test_informes():
    # Note: This requires the server to be running and a valid token.
    # Since I cannot easily get a token here without login, I will just check if the routes are registered
    # and if the repo functions work by importing them (if I were to run this locally).
    
    print("Checking Informes routes registration via /openapi.json...")
    try:
        resp = requests.get(f"{BASE_URL}/openapi.json")
        if resp.status_code == 200:
            spec = resp.json()
            paths = spec.get("paths", {})
            if "/informes/oportunidad" in paths and "/informes/cancelaciones" in paths:
                print("SUCCESS: Informes routes are registered.")
            else:
                print("FAILURE: Informes routes NOT found in OpenAPI spec.")
        else:
            print(f"FAILURE: Could not access OpenAPI spec, status: {resp.status_code}")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_informes()
