import sys
import os
import json

# Add project root to path
sys.path.append(os.getcwd())

from app.database import chat_repo, connection

def verify_visibility():
    print("Verifying visibility logic...")
    
    # 1. Create a dummy session
    session_id = chat_repo.create_session(None)
    print(f"Created test session {session_id}")
    
    try:
        # 2. Add filtered messages
        chat_repo.add_message(session_id, "system", "Target ADMIN only", meta={"target": "admin"})
        chat_repo.add_message(session_id, "system", "Target PATIENT only", meta={"target": "patient"})
        chat_repo.add_message(session_id, "system", "Target ALL (None)")
        
        # 3. Retrieve as Patient
        patient_msgs = chat_repo.get_messages(session_id, target="patient")
        patient_contents = [m['content'] for m in patient_msgs]
        print(f"Patient messages: {patient_contents}")
        
        assert "Target ADMIN only" not in patient_contents, "ERROR: Patient saw admin message"
        assert "Target PATIENT only" in patient_contents, "ERROR: Patient missed their message"
        assert "Target ALL (None)" in patient_contents, "ERROR: Patient missed public message"
        
        # 4. Retrieve as Admin
        admin_msgs = chat_repo.get_messages(session_id, target="admin")
        admin_contents = [m['content'] for m in admin_msgs]
        print(f"Admin messages: {admin_contents}")
        
        assert "Target PATIENT only" not in admin_contents, "ERROR: Admin saw patient message"
        assert "Target ADMIN only" in admin_contents, "ERROR: Admin missed their message"
        assert "Target ALL (None)" in admin_contents, "ERROR: Admin missed public message"
        
        print("\nSUCCESS: Visibility filters working as expected!")
        
    finally:
        # Cleanup
        chat_repo.delete_sessions([session_id])
        print(f"Cleaned up session {session_id}")

if __name__ == "__main__":
    verify_visibility()
