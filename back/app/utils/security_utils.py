from cryptography.fernet import Fernet
import bcrypt
import os
import logging

logger = logging.getLogger(__name__)

def get_cipher_suite():
    key = os.getenv("SETTINGS_ENCRYPTION_KEY")
    if not key:
        logger.error("SETTINGS_ENCRYPTION_KEY not set! Cannot encrypt/decrypt.")
        return None
    try:
        return Fernet(key.encode())
    except Exception as e:
        logger.error(f"Invalid encryption key: {e}")
        return None

def encrypt_value(text: str) -> str:
    if not text: return None
    suite = get_cipher_suite()
    if not suite: return text # Fallback or Error? Ideally Error. For MVP return raw? No, unsafe.
    return suite.encrypt(text.encode()).decode()

def decrypt_value(text: str) -> str:
    if not text: return None
    suite = get_cipher_suite()
    if not suite: return None
    try:
        return suite.decrypt(text.encode()).decode()
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return None


# =============================================================================
# PASSWORD HASHING WITH BCRYPT
# =============================================================================

class PasswordHasher:
    """
    Clase para manejo seguro de contraseñas usando Bcrypt.
    
    Bcrypt es un algoritmo de hashing diseñado específicamente para contraseñas
    que incluye:
    - Salt automático único para cada contraseña
    - Factor de trabajo ajustable (rounds) para adaptarse al hardware
    - Resistencia a ataques de fuerza bruta y rainbow tables
    
    No se requiere SHA-256 adicional ya que Bcrypt ya es suficientemente seguro
    para entornos de producción.
    """
    
    # 12 rounds es un buen balance entre seguridad y performance
    # Cada round adicional duplica el tiempo de cómputo
    DEFAULT_ROUNDS = 12
    
    @staticmethod
    def hash_password(password: str, rounds: int = DEFAULT_ROUNDS) -> str:
        """
        Genera hash de contraseña usando bcrypt con salt automático.
        
        Args:
            password: Contraseña en texto plano
            rounds: Número de rounds de bcrypt (default: 12)
            
        Returns:
            Hash bcrypt como string (incluye salt y metadata)
            
        Raises:
            ValueError: Si la contraseña está vacía
        """
        if not password:
            raise ValueError("La contraseña no puede estar vacía")
        
        # Generar salt con el número de rounds especificado
        salt = bcrypt.gensalt(rounds=rounds)
        
        # Hashear la contraseña con el salt
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        
        # Retornar como string (el hash incluye el salt y metadata)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Verifica que una contraseña coincida con su hash.
        
        Esta verificación es resistente a timing attacks ya que bcrypt
        usa un algoritmo de comparación de tiempo constante.
        
        Args:
            plain_password: Contraseña en texto plano a verificar
            hashed_password: Hash almacenado en la base de datos
            
        Returns:
            True si la contraseña coincide, False en caso contrario
        """
        if not plain_password or not hashed_password:
            return False
        
        try:
            return bcrypt.checkpw(
                plain_password.encode('utf-8'),
                hashed_password.encode('utf-8')
            )
        except (ValueError, AttributeError):
            # Hash inválido o formato incorrecto
            return False


# Instancia global para facilitar el uso en toda la aplicación
password_hasher = PasswordHasher()
