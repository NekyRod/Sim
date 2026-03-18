# app/security.py
from typing import Annotated, List
from datetime import datetime, timezone


import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.config.settings import settings   # <--- aquí

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=settings.TOKEN_URL)  # <--- usar settings

SECRET_KEY = settings.JWT_SECRET          # <--- usar settings
ALGORITHM = settings.JWT_ALGORITHM


async def get_current_user_token(
    token: Annotated[str, Depends(oauth2_scheme)],
) -> dict:
    """
    Decodifica y valida el JWT token.
    
    Returns:
        dict: Payload del JWT que incluye:
            - sub: username
            - user_id: ID del usuario
            - role_id: ID del rol
            - role_name: Nombre del rol
            - permissions: Lista de scopes ['GROUP:action']
    """
    cred_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autorizado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise cred_exc

    exp = payload.get("exp")
    if exp is not None and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(
        timezone.utc
    ):
        raise cred_exc

    return payload


# =============================================================================
# PERMISSION CHECKER
# =============================================================================

class PermissionChecker:
    """
    Dependency para validar permisos basado en JWT scopes.
    
    Valida que el usuario tenga el permiso específico (grupo:acción) requerido
    para acceder al endpoint.
    
    Usage:
        # En un router
        @router.get("/", dependencies=[Depends(PermissionChecker("AGENDAMIENTO", "view"))])
        def list_appointments():
            ...
        
        # En un endpoint específico
        @router.post("/", dependencies=[Depends(PermissionChecker("PACIENTES", "create"))])
        def create_patient():
            ...
    """
    
    def __init__(self, permission_group: str, action: str):
        """
        Args:
            permission_group: Código del grupo de permisos (ej: "AGENDAMIENTO")
            action: Acción requerida (ej: "view", "create", "edit", "delete")
        """
        self.permission_group = permission_group.upper()
        self.action = action.lower()
        self.required_scope = f"{self.permission_group}:{self.action}"
    
    async def __call__(
        self,
        token_payload: Annotated[dict, Depends(get_current_user_token)]
    ) -> dict:
        """
        Valida que el usuario tenga el permiso requerido.
        
        Args:
            token_payload: Payload del JWT ya decodificado
            
        Returns:
            dict: El mismo payload si la validación es exitosa
            
        Raises:
            HTTPException: 403 si el usuario no tiene permisos
        """
        permissions: List[str] = token_payload.get("permissions", [])
        
        # Admin tiene acceso a todo automáticamente
        role_name = token_payload.get("role_name", "")
        if role_name == "Administrador":
            return token_payload
        
        # Validar que el scope requerido esté en los permisos del usuario
        if self.required_scope not in permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No tiene permisos para {self.action} en {self.permission_group}"
            )
        
        return token_payload


def require_permissions(group: str, *actions: str):
    """
    Helper para validar que el usuario tenga AL MENOS UNA de varias acciones.
    
    Útil cuando un endpoint puede ser accedido con diferentes niveles de permiso.
    
    Args:
        group: Código del grupo de permisos
        *actions: Una o más acciones requeridas (OR lógico)
        
    Usage:
        # Usuario necesita ver O editar pacientes
        @router.get("/{id}", dependencies=[Depends(require_permissions("PACIENTES", "view", "edit"))])
        def get_patient(id: int):
            ...
    """
    async def checker(token_payload: Annotated[dict, Depends(get_current_user_token)]) -> dict:
        permissions = token_payload.get("permissions", [])
        role_name = token_payload.get("role_name", "")
        
        # Admin bypass
        if role_name == "Administrador":
            return token_payload
        
        # Construir scopes requeridos
        required_scopes = [f"{group.upper()}:{action.lower()}" for action in actions]
        
        # Verificar si tiene al menos uno
        has_permission = any(scope in permissions for scope in required_scopes)
        
        if not has_permission:
            actions_str = " o ".join(actions)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requiere permisos de {actions_str} en {group}"
            )
        
        return token_payload
    
    return checker
