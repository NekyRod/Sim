#!/usr/bin/env python3
"""
Script para crear el archivo de configuración encriptado app.conf
con las credenciales de la base de datos (sin dependencias de GUI).
"""
import os
import json
from cryptography.fernet import Fernet

# Configuración de la base de datos
config = {
    "host": "localhost",
    "dbname": "sim",
    "user": "admiSim",
    "password": "RAqk3TqV1hSGlVooeJHd",
    "port": 5432
}

# Rutas
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CONFIG_PATH = os.path.join(PROJECT_DIR, "back", "app", "config")
KEY_FILE = os.path.join(CONFIG_PATH, "app.key")
CONFIG_FILE = os.path.join(CONFIG_PATH, "app.conf")

def main():
    print("Creando archivo de configuración encriptado...")
    
    # Crear directorio si no existe
    if not os.path.exists(CONFIG_PATH):
        os.makedirs(CONFIG_PATH)
        print(f"✅ Directorio creado: {CONFIG_PATH}")
    
    # Cargar o crear la clave de encriptación
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "rb") as f:
            fernet_key = f.read()
        print(f"✅ Clave de encriptación cargada desde {KEY_FILE}")
    else:
        fernet_key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as f:
            f.write(fernet_key)
        print(f"✅ Nueva clave de encriptación generada y guardada en {KEY_FILE}")
    
    # Encriptar y guardar la configuración
    fernet = Fernet(fernet_key)
    config_json = json.dumps(config)
    encrypted_data = fernet.encrypt(config_json.encode()).decode()
    
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        f.write(encrypted_data)
    
    print(f"✅ Archivo app.conf creado exitosamente en {CONFIG_FILE}")
    print(f"\nConfiguración guardada:")
    print(f"  - Host: {config['host']}")
    print(f"  - Database: {config['dbname']}")
    print(f"  - User: {config['user']}")
    print(f"  - Port: {config['port']}")

if __name__ == "__main__":
    main()
