import sys
import os

# Add back directory to path
sys.path.append('d:/OneDrive/Desarr/Proyectos/GOI/back')

from app.config.config import load_config

try:
    config = load_config()
    if config:
        print("--- CONFIG START ---")
        print(f"DB_HOST={config.get('host')}")
        print(f"DB_NAME={config.get('dbname')}")
        print(f"DB_USER={config.get('user')}")
        print(f"DB_PASS={config.get('password')}")
        print(f"DB_PORT={config.get('port')}")
        print("--- CONFIG END ---")
    else:
        print("Config could not be loaded")
except Exception as e:
    print(f"Error loading config: {e}")
