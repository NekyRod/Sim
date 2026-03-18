"""
Rutas de administración de Usuarios (Solo Admin)

Este módulo define los endpoints REST para gestión completa de usuarios,
asignación de roles y gestión de contraseñas.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from app.services.user_service import UserService
from app.config.security import PermissionChecker

router = APIRouter(
    prefix="/admin/users",
    tags=["admin-users"],
    dependencies=[Depends(PermissionChecker("ADMIN", "view"))]
)

# =============================================================================
# SCHEMAS
# =============================================================================

class UserCreate(BaseModel):
    """Schema para creación de usuario"""
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6)
    role_id: int

class UserRoleUpdate(BaseModel):
    """Schema para actualización de rol de usuario"""
    role_id: int

class PasswordChange(BaseModel):
    """Schema para cambio de contraseña"""
    new_password: str = Field(..., min_length=6)

# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/")
def list_users():
    """
    Lista todos los usuarios con su rol asignado.
    
    Requiere permiso: ADMIN:view
    """
    return UserService.get_all_users()

@router.get("/{user_id}")
def get_user(user_id: int):
    """
    Obtiene un usuario específico con su información de rol.
    
    Args:
        user_id: ID del usuario
        
    Returns:
        Información del usuario con rol
        
    Raises:
        404: Si el usuario no existe
        
    Requiere permiso: ADMIN:view
    """
    user = UserService.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    return user

@router.post("/", 
            status_code=status.HTTP_201_CREATED,
            dependencies=[Depends(PermissionChecker("ADMIN", "create"))])
def create_user(body: UserCreate):
    """
    Crea un nuevo usuario con contraseña hasheada.
    
    La contraseña se hashea automáticamente usando Bcrypt antes
    de almacenarse en la base de datos.
    
    Args:
        body: Datos del nuevo usuario
        
    Raises:
        400: Si el username ya existe o hay error de validación
        
    Requiere permiso: ADMIN:create
    """
    try:
        return UserService.create_user(
            username=body.username,
            password=body.password,
            role_id=body.role_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear usuario: {str(e)}"
        )

@router.put("/{user_id}/role", 
           dependencies=[Depends(PermissionChecker("ADMIN", "edit"))])
def update_user_role(user_id: int, body: UserRoleUpdate):
    """
    Actualiza el rol asignado a un usuario.
    
    Args:
        user_id: ID del usuario
        body: Nuevo rol a asignar
        
    Raises:
        404: Si el usuario no existe
        
    Requiere permiso: ADMIN:edit
    """
    try:
        return UserService.update_user_role(user_id, body.role_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/{user_id}/password", 
            dependencies=[Depends(PermissionChecker("ADMIN", "edit"))])
def change_password(user_id: int, body: PasswordChange):
    """
    Cambia la contraseña de un usuario.
    
    La nueva contraseña se hashea automáticamente con Bcrypt.
    
    Args:
        user_id: ID del usuario
        body: Nueva contraseña
        
    Raises:
        404: Si el usuario no existe
        400: Si la contraseña no cumple requisitos
        
    Requiere permiso: ADMIN:edit
    """
    try:
        UserService.change_password(user_id, body.new_password)
        return {"message": "Contraseña actualizada correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{user_id}/toggle", 
            dependencies=[Depends(PermissionChecker("ADMIN", "edit"))])
def toggle_user_status(user_id: int):
    """
    Activa o desactiva un usuario (alterna estado actual).
    
    Args:
        user_id: ID del usuario
        
    Returns:
        Usuario con estado actualizado
        
    Raises:
        404: Si el usuario no existe
        
    Requiere permiso: ADMIN:edit
    """
    try:
        return UserService.toggle_user_status(user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.delete("/{user_id}",
              dependencies=[Depends(PermissionChecker("ADMIN", "delete"))])
def delete_user(user_id: int):
    """
    Elimina permanentemente un usuario.
    
    Args:
        user_id: ID del usuario
        
    Raises:
        404: Si el usuario no existe o tiene dependencias
        
    Requiere permiso: ADMIN:delete
    """
    try:
        UserService.delete_user(user_id)
        return {"message": "Usuario eliminado permanentemente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
