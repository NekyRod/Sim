# Configuración central, carga de variables de entorno, etc.
import os
import json
from tkinter import messagebox
from app.config.crypt_util import encrypt_text, decrypt_text, CONFIG_PATH

# Archivo donde se guardará la configuración
CONFIG_FILE = os.path.join(CONFIG_PATH, "app.conf")

def load_config():
    """
    Si existe el archivo de configuración, se lee, se desencripta y se retorna un diccionario.
    """
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                encrypted_data = f.read()
            decrypted_data = decrypt_text(encrypted_data)
            config = json.loads(decrypted_data)
            #print ('Configuración cargada:', config)
            return config
        except Exception as e:
            messagebox.showerror("Error", "Error al leer configuración: " + str(e))
            return None
    return None

def save_config(config):
    """
    Guarda el diccionario de configuración en un archivo encriptado.
    """
    try:
        if not os.path.exists(CONFIG_PATH):
            os.makedirs(CONFIG_PATH)
        config_json = json.dumps(config)
        #print ('Configuración a guardar:', config)
        encrypted_data = encrypt_text(config_json)
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            f.write(encrypted_data)
    except Exception as e:
        messagebox.showerror("Error", "Error al guardar configuración: " + str(e))