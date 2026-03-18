import requests
import jwt
import datetime
import os
import sys

# Constants
BASE_URL = "http://localhost:8001"
# This secret is loaded from app/config/config_jwt.py which likely loads from file or env.
# In verify_chat.py we might not have access to the same loaded secret unless we import it OR read the key file.
# Let's try to import the config.
sys.path.append(os.getcwd())
from app.config.settings import settings

JWT_SECRET = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALGORITHM

def create_test_token(email):
    payload = {
        "sub": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def get_real_patient_email():
    from app.database import pacientes_repo
    # Get any active patient
    # We need to run this in context of app (db connection)
    try:
        conn = pacientes_repo.get_db_connection()
        with conn, conn.cursor() as cur:
            cur.execute("SELECT correo_electronico FROM pacientes WHERE activo = TRUE LIMIT 1")
            row = cur.fetchone()
            if row:
                return row[0]
    except Exception as e:
        print(f"Error fetching patient: {e}")
    return "test@patient.com"

def test_chat_flow():
    email = get_real_patient_email()
    print(f"Using patient email: {email}")
    
    token = create_test_token(email)
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Start Session
    print("\n1. Starting Session...")
    resp = requests.post(f"{BASE_URL}/patient/chat/sessions", headers=headers)
    
    if resp.status_code != 200:
        print(f"Failed to start session: {resp.status_code} {resp.text}")
        return
        
    session = resp.json()
    session_id = session['session_id']
    print(f"Session ID: {session_id}, Status: {session['status']}")
    
    # 2. Get Initial Messages
    print("\n2. Getting Messages...")
    resp = requests.get(f"{BASE_URL}/patient/chat/sessions/{session_id}/messages", headers=headers)
    msgs = resp.json()
    for m in msgs:
        print(f"[{m['sender_type']}] {m['content']}")

    # 3. Send Option 4 (Ubicacion)
    print("\n3. Sending Option 4 (Ubicacion)...")
    resp = requests.post(f"{BASE_URL}/patient/chat/sessions/{session_id}/messages", 
                         json={"content": "4"}, headers=headers)
    print(f"Send status: {resp.status_code}")
    
    # 4. Get Messages Again
    print("\n4. Getting Messages...")
    resp = requests.get(f"{BASE_URL}/patient/chat/sessions/{session_id}/messages", headers=headers)
    msgs = resp.json()
    # Print last few checks
    for m in msgs: # Print all to see history
         print(f"[{m['sender_type']}] {m['content']}")

if __name__ == "__main__":
    test_chat_flow()
