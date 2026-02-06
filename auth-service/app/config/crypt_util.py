import os
from cryptography.fernet import Fernet

# Ubicación de la carpeta de configuración (donde se guarda la llave)
CONFIG_PATH = os.path.join(os.getcwd(), "app/config")
KEY_FILE = os.path.join(CONFIG_PATH, "app.key")

if os.path.exists(KEY_FILE):
    with open(KEY_FILE, "rb") as f:
        FERNET_KEY = f.read()
else:
    if not os.path.exists(CONFIG_PATH):
        os.makedirs(CONFIG_PATH)
    FERNET_KEY = Fernet.generate_key()
    with open(KEY_FILE, "wb") as f:
        f.write(FERNET_KEY)

fernet = Fernet(FERNET_KEY)

def encrypt_text(text):
    """Encripta una cadena y devuelve el resultado (string)."""
    return fernet.encrypt(text.encode()).decode()

def decrypt_text(token):
    """Desencripta el token proporcionado y retorna la cadena original."""
    return fernet.decrypt(token.encode()).decode()