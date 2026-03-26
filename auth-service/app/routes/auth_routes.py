from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt
import jwt
from datetime import datetime, timedelta
from app.config.settings import settings
from app.database.connection import get_db_connection as get_connection
from app.services.permission_service import get_user_permissions

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/token")
def login(body: LoginRequest):
    """
    Endpoint de autenticación que genera JWT con permisos incluidos.
    
    El token generado incluye:
    - user_id: ID del usuario
    - username: Nombre de usuario
    - role_id: ID del rol asignado
    - role_name: Nombre del rol
    - permissions: Array de scopes (ej: ['AGENDAMIENTO:view', 'PACIENTES:edit'])
    """
    sql = """
        SELECT u.*, r.id as role_id, r.name as role_name 
        FROM usuarios u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.username = %s AND u.activo = TRUE
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (body.username,))
            user = cur.fetchone()
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Verificar contraseña con bcrypt
    stored_hash = user["password_hash"]
    ok = bcrypt.checkpw(body.password.encode("utf-8"), stored_hash.encode("utf-8"))

    if not ok:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Obtener permisos del rol (scopes para JWT)
    permissions = get_user_permissions(user["role_id"]) if user["role_id"] else []
    
    # Construir payload del JWT con permisos
    payload = {
        "sub": user["username"],
        "user_id": user["id"],
        "role_id": user["role_id"],
        "role_name": user["role_name"],
        "permissions": permissions,  # Lista de scopes: ["AGENDAMIENTO:view", "PACIENTES:edit"]
        "exp": datetime.utcnow() + timedelta(minutes=15)
    }
    
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    return {
        "access_token": token, 
        "token_type": "bearer", 
        "role": user["role_name"],
        "user_id": user["id"],
        "permissions": permissions
    }
