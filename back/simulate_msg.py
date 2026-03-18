import requests
import json

BASE_URL = "http://localhost:8002/patient/chat" # Port 8002 as seen in screenshot

def test_send_1():
    # 1. Start session
    try:
        resp = requests.post(f"{BASE_URL}/sessions", json={"name": "Test User", "documento": "123456"})
        if resp.status_code != 200:
            print(f"Failed to start session: {resp.status_code} {resp.text}")
            return
        
        session_id = resp.json().get("session_id")
        print(f"Started session {session_id}")
        
        # 2. Send "1"
        print("Sending '1'...")
        resp2 = requests.post(f"{BASE_URL}/sessions/{session_id}/messages", json={"content": "1"})
        print(f"Response ({resp2.status_code}): {resp2.text}")
        
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    test_send_1()
