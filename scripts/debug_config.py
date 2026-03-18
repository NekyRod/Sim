#!/usr/bin/env python3
"""
Script para depurar el problema de carga de configuración.
"""
import os
import json
from cryptography.fernet import Fernet

# Rutas
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CONFIG_PATH = os.path.join(PROJECT_DIR, "back", "app", "config")
KEY_FILE = os.path.join(CONFIG_PATH, "app.key")
CONFIG_FILE = os.path.join(CONFIG_PATH, "app.conf")

print("=== DEBUG CONFIGURACIÓN ===\n")

# 1. Verificar archivos
print(f"1. Verificando archivos:")
print(f"   KEY_FILE: {KEY_FILE}")
print(f"   Existe: {os.path.exists(KEY_FILE)}")
print(f"   CONFIG_FILE: {CONFIG_FILE}")
print(f"   Existe: {os.path.exists(CONFIG_FILE)}")

# 2. Leer la clave
if os.path.exists(KEY_FILE):
    with open(KEY_FILE, "rb") as f:
        key = f.read()
    print(f"\n2. Clave leída: {len(key)} bytes")
else:
    print("\n2. ❌ No se encontró el archivo de clave")
    exit(1)

# 3. Leer el archivo de configuración
if os.path.exists(CONFIG_FILE):
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        encrypted_data = f.read()
    print(f"\n3. Datos encriptados leídos: {len(encrypted_data)} caracteres")
    print(f"   Primeros 50 caracteres: {encrypted_data[:50]}")
else:
    print("\n3. ❌ No se encontró el archivo de configuración")
    exit(1)

# 4. Intentar desencriptar
try:
    fernet = Fernet(key)
    decrypted_data = fernet.decrypt(encrypted_data.encode()).decode()
    print(f"\n4. ✅ Desencriptación exitosa")
    print(f"   Datos desencriptados: {decrypted_data}")
    
    # 5. Parsear JSON
    config = json.loads(decrypted_data)
    print(f"\n5. ✅ JSON parseado exitosamente:")
    print(json.dumps(config, indent=2))
    
except Exception as e:
    print(f"\n4. ❌ Error al desencriptar: {e}")
    import traceback
    traceback.print_exc()
