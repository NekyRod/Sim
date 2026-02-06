# app/config/settings.py
import os
from dotenv import load_dotenv
from app.config.config_jwt import init_jwt_secret_if_needed, load_jwt_secret

load_dotenv()

# URLs de servicios externos
class Settings:
    """Configuración centralizada"""
    
    # URLs de los servicios
    AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")
    TOKEN_URL = os.getenv("TOKEN_URL")
    FRONTEND_URL = os.getenv("FRONTEND_URL")
    
   
    
    # JWT
    JWT_SECRET: str = load_jwt_secret()
    JWT_ALGORITHM: str = os.getenv("ALGORITHM")
    
    class Config:
        env_file = ".env"

settings = Settings()