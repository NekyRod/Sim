"""
Rutas de administración de Roles y Permisos (Solo Admin)

Este módulo define los endpoints REST para gestión completa de roles,
asignación de permisos y consultas de metadatos del sistema RBAC.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from app.services.role_service import RoleService
from app.config.security import PermissionChecker

router = APIRouter(
    prefix="/admin/roles",
    tags=["admin-roles"],
    dependencies=[Depends(PermissionChecker("ADMIN", "view"))]
)

# =============================================================================
# SCHEMAS
# =============================================================================

class RoleCreate(BaseModel):
    """Schema para creación de rol"""
    name: str
    description: Optional[str] = None

class RoleUpdate(BaseModel):
    """Schema para actualización de rol"""
    name: str
    description: Optional[str] = None

class PermissionItem(BaseModel):
    """Schema para item de permiso individual"""
    group_id: int
    action_id: int

class PermissionAssignment(BaseModel):
    """Schema para asignación masiva de permisos"""
    permissions: List[PermissionItem]

# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/")
def list_roles():
    """
    Lista todos los roles activos con conteo de permisos.
    
    Requiere permiso: ADMIN:view
    """
    return RoleService.get_all_roles()

@router.get("/{role_id}")
def get_role(role_id: int):
    """
    Obtiene un rol específico con todos sus permisos detallados.
    
    Args:
        role_id: ID del rol a consultar
        
    Returns:
        Rol con lista de permisos expandida
        
    Raises:
        404: Si el rol no existe
        
    Requiere permiso: ADMIN:view
    """
    role = RoleService.get_role_by_id(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Rol no encontrado"
        )
    return role

@router.post("/", 
            status_code=status.HTTP_201_CREATED,
            dependencies=[Depends(PermissionChecker("ADMIN", "create"))])
def create_role(body: RoleCreate):
    """
    Crea un nuevo rol.
    
    El rol se crea sin permisos asignados. Use el endpoint de asignación
    de permisos para configurarlos.
    
    Requiere permiso: ADMIN:create
    """
    try:
        return RoleService.create_role(body.name, body.description)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear rol: {str(e)}"
        )

@router.put("/{role_id}", 
           dependencies=[Depends(PermissionChecker("ADMIN", "edit"))])
def update_role(role_id: int, body: RoleUpdate):
    """
    Actualiza nombre y descripción de un rol.
    
    Solo roles no-sistema pueden ser editados.
    Los permisos se actualizan mediante endpoint separado.
    
    Args:
        role_id: ID del rol a actualizar
        
    Raises:
        400: Si el rol es de sistema
        404: Si el rol no existe
        
    Requiere permiso: ADMIN:edit
    """
    try:
        return RoleService.update_role(role_id, body.name, body.description)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{role_id}/permissions", 
            dependencies=[Depends(PermissionChecker("ADMIN", "edit"))])
def assign_permissions(role_id: int, body: PermissionAssignment):
    """
    Asigna permisos a un rol, reemplazando los existentes.
    
    Esta operación es atómica: todos los permisos anteriores se eliminan
    y se asignan los nuevos en una transacción.
    
    Args:
        role_id: ID del rol
        body: Lista de permisos a asignar
        
    Example:
        {
            "permissions": [
                {"group_id": 1, "action_id": 1},  // AGENDAMIENTO:view
                {"group_id": 1, "action_id": 2}   // AGENDAMIENTO:create
            ]
        }
        
    Requiere permiso: ADMIN:edit
    """
    try:
        # Convertir de Pydantic a dict simple
        perms = [p.dict() for p in body.permissions]
        RoleService.assign_permissions(role_id, perms)
        return {"message": "Permisos asignados correctamente"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al asignar permisos: {str(e)}"
        )

@router.delete("/{role_id}",
              dependencies=[Depends(PermissionChecker("ADMIN", "delete"))])
def delete_role(role_id: int):
    """
    Elimina un rol (soft delete).
    
    Solo roles no-sistema pueden ser eliminados.
    
    Args:
        role_id: ID del rol a eliminar
        
    Raises:
        400: Si el rol es de sistema
        404: Si el rol no existe
        
    Requiere permiso: ADMIN:delete
    """
    try:
        RoleService.delete_role(role_id)
        return {"message": "Rol eliminado correctamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# =============================================================================
# METADATA ENDPOINTS
# =============================================================================

@router.get("/metadata/groups")
def get_permission_groups():
    """
    Obtiene grupos de permisos disponibles.
    
    Útil para construir interfaces de asignación de permisos.
    
    Requiere permiso: ADMIN:view
    """
    return RoleService.get_permission_groups()

@router.get("/metadata/actions")
def get_actions():
    """
    Obtiene acciones disponibles (view, create, edit, delete).
    
    Útil para construir interfaces de asignación de permisos.
    
    Requiere permiso: ADMIN:view
    """
    return RoleService.get_actions()
