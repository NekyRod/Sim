import sys
from app.main import app

print("Listing registered routes:")
for route in app.routes:
    print(f"{route.path} {route.methods}")
