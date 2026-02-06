# app/config/config_jwt.py
import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet
load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))   # app/config
CONF_PATH = os.path.join(BASE_DIR, "jwt.conf")
# clave de cifrado; guárdala como variable de entorno o en .env
FERNET_KEY = os.getenv("JWT_FERNET_KEY")
#print("Using JWT_FERNET_KEY:", FERNET_KEY)
#if not FERNET_KEY:
    # solo para desarrollo; en producción define JWT_FERNET_KEY en el entorno
    #FERNET_KEY = Fernet.generate_key().decode()
    # aquí podrías imprimirla una vez y guardarla manualmente en .env
    #print("GENERATED JWT_FERNET_KEY:", FERNET_KEY)

fernet = Fernet(FERNET_KEY.encode())


def init_jwt_secret_if_needed(plain_secret: str):
    """
    Si jwt.conf no existe, cifra plain_secret y lo guarda.
    """
    if os.path.exists(CONF_PATH):
        return

    token = fernet.encrypt(plain_secret.encode())
    with open(CONF_PATH, "wb") as f:
        f.write(token)


def load_jwt_secret() -> str:
    """
    Lee jwt.conf, lo desencripta y devuelve el secret en texto plano.
    """
    if not os.path.exists(CONF_PATH):
        raise RuntimeError("jwt.conf no existe; ejecuta init_jwt_secret_if_needed primero")

    with open(CONF_PATH, "rb") as f:
        token = f.read()

    return fernet.decrypt(token).decode()
