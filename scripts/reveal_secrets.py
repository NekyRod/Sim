import sys
import os

# Add auth-service to path
sys.path.append(os.path.abspath("auth-service"))

try:
    from app.config.config import load_config
    from app.config.config_jwt import load_jwt_secret

    db_config = load_config()
    jwt_secret = load_jwt_secret()
    
    password = db_config.get('password', 'password') if db_config else 'password'
    
    with open("secrets.txt", "w") as f:
        f.write(f"$env:POSTGRES_PASSWORD='{password}'\n")
        f.write(f"$env:JWT_SECRET='{jwt_secret}'\n")
        f.write(f"$env:FRONTEND_URL='http://localhost:5173'\n")

except Exception as e:
    with open("secrets.txt", "w") as f:
        f.write(f"Error: {e}")
