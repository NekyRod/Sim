import os
from dotenv import load_dotenv
load_dotenv()

from app.routes.auth_routes import login, LoginRequest
from pydantic import ValidationError

print("Testing login logic directly...")
try:
    # Use a dummy request that should pass validation but fail authentication
    req = LoginRequest(username="invalid_user_xyz", password="wrong_password")
    print(f"Request: {req}")
    result = login(req)
    print(f"Result: {result}")
except HTTPException as e:
    print(f"HTTPException: {e.status_code} - {e.detail}")
except Exception as e:
    print(f"Exception: {e}")
    import traceback
    traceback.print_exc()
