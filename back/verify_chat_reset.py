import os
import sys

# Add app to path
sys.path.append(os.getcwd())

from app.control import chat_control
from app.database import chat_repo

def verify_chat_reset():
    print("Verifying Chat Reset Logic...")
    
    # 1. Create a fresh session
    sess = chat_control.create_or_get_session(name="Test User", documento="12345")
    session_id = sess['id']
    content = "0"
    
    print(f"Sending '{content}' to session {session_id}...")
    try:
        chat_control.handle_patient_message(session_id, content)
        
        # 2. Verify the last message in the repo is the menu
        messages = chat_repo.get_messages(session_id, limit=5)
        if messages:
            last_msg = messages[0] # Usually desc
            print(f"Last system message: {last_msg['content'][:50]}...")
            if "Seleccione una opción:" in last_msg['content']:
                print("SUCCESS: Chat reset to Main Menu.")
            else:
                print("FAILURE: Last message is not the menu.")
        else:
            print("FAILURE: No messages found in session.")
            
    except Exception as e:
        print(f"ERROR during verification: {e}")

if __name__ == "__main__":
    verify_chat_reset()
