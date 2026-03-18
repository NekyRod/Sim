import os
import sys
# Add the current directory to path to import app
sys.path.append(os.getcwd())
try:
    from app.config.config import load_config
    config = load_config() or {}
    
    # Mirror logic from connection.py
    host = os.getenv("POSTGRES_HOST") or config.get("host", "localhost")
    dbname = os.getenv("POSTGRES_DB") or config.get("dbname", "mydatabase")
    user = os.getenv("POSTGRES_USER") or config.get("user", "postgres")
    password = os.getenv("POSTGRES_PASSWORD") or config.get("password", "password")
    port = os.getenv("POSTGRES_PORT") or config.get("port", 5432)

    print(f"BACK_CONNECTION_INFO: host={host}, dbname={dbname}, user={user}, password={password}, port={port}")
except Exception as e:
    print(f"Error: {e}")
