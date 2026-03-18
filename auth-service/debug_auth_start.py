import sys
import os

# Add current directory to path so app module can be found
sys.path.append(os.getcwd())

try:
    print("Attempting to import app.main...")
    from app.main import app
    print("Successfully imported app.main")
except Exception:
    import traceback
    traceback.print_exc()
