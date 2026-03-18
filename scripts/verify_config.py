#!/usr/bin/env python3
"""
Script para verificar y mostrar la configuración encriptada.
"""
import os
import json

# Rutas
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CONFIG_PATH = os.path.join(PROJECT_DIR, "back", "app", "config")
KEY_FILE = os.path.join(CONFIG_PATH, "app.key")
CONFIG_FILE = os.path.join(CONFIG_PATH, "app.conf")

print(f"CONFIG_PATH: {CONFIG_PATH}")
print(f"KEY_FILE exists: {os.path.exists(KEY_FILE)}")
print(f"CONFIG_FILE exists: {os.path.exists(CONFIG_FILE)}")

if os.path.exists(CONFIG_FILE):
    print(f"\nTamaño de app.conf: {os.path.getsize(CONFIG_FILE)} bytes")
    
    # Intentar cargar la configuración
    import sys
    sys.path.insert(0, os.path.join(PROJECT_DIR, 'back'))
    
    try:
        from app.config.config import load_config
        config = load_config()
        if config:
            print("\n✅ Configuración cargada exitosamente:")
            print(json.dumps(config, indent=2))
        else:
            print("\n❌ load_config() retornó None")
    except Exception as e:
        print(f"\n❌ Error al cargar configuración: {e}")
        import traceback
        traceback.print_exc()
