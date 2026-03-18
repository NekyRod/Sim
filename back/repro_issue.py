
import sys
import os
sys.path.append(os.getcwd())

from app.database import chat_repo
from app.control import chat_control
import json

def test_admin_view():
    print("Testing get_all_sessions...")
    try:
        sessions = chat_repo.get_all_sessions()
        print(f"Success. Retrieved {len(sessions)} sessions.")
        for i, s in enumerate(sessions):
            # Try to serialize to ensure it's valid JSON
            try:
                json.dumps(s)
            except TypeError as e:
                print(f"FAILED JSON dump for session {s.get('id')}: {e}")
                print(s)
    except Exception as e:
        print(f"FAILED get_all_sessions: {e}")
        import traceback
        traceback.print_exc()

def test_create_guest():
    print("\nTesting create_or_get_session for guest...")
    try:
        s = chat_control.create_or_get_session(name="DebugUser", documento="99999999")
        print(f"Success. Session: {s['id']} Status: {s['status']}")
    except Exception as e:
        print(f"FAILED create_or_get_session: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_admin_view()
    test_create_guest()
