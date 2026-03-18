#!/usr/bin/env python3
"""
Script de prueba para verificar la conexión a la base de datos.
"""
import sys
import os

# Añadir el directorio raíz del proyecto al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'back'))

from app.database.connection import get_db_connection

def test_connection():
    print("Probando conexión a la base de datos...")
    try:
        conn = get_db_connection()
        print("✅ Conexión exitosa!")
        
        cursor = conn.cursor()
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        tables = cursor.fetchall()
        
        print(f"\nTablas encontradas ({len(tables)}):")
        for table in tables:
            print(f"  - {table[0]}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
