"""
Servicio de permisos para el sistema de autenticación

Este módulo maneja la obtención de permisos de usuarios desde la base de datos
y su conversión al formato de scopes para JWT.
"""
from typing import List
from app.database.connection import get_db_connection


def get_user_permissions(role_id: int) -> List[str]:
    """
    Obtiene permisos del usuario en formato scope: 'GROUP:action'
    
    Los scopes son cadenas que combinan el código del grupo de permisos
    con la acción permitida, por ejemplo:
    - 'AGENDAMIENTO:view'
    - 'AGENDAMIENTO:create'
    - 'PACIENTES:edit'
    - 'ADMIN:delete'
    
    Args:
        role_id: ID del rol del usuario
        
    Returns:
        Lista de scopes (strings) que representan los permisos del usuario.
        Retorna lista vacía si el usuario no tiene rol asignado.
        
    Example:
        >>> perms = get_user_permissions(1)
        >>> print(perms)
        ['AGENDAMIENTO:view', 'AGENDAMIENTO:create', 'PACIENTES:view', ...]
    """
    if not role_id:
        return []
    
    sql = """
        SELECT pg.code as group_code, a.code as action_code
        FROM role_permissions rp
        JOIN permission_groups pg ON rp.permission_group_id = pg.id
        JOIN actions a ON rp.action_id = a.id
        WHERE rp.role_id = %s AND pg.active = TRUE
        ORDER BY pg.code, a.code
    """
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (role_id,))
                rows = cur.fetchall()
        
        # Convertir a formato scope: GROUP:action
        return [f"{row['group_code']}:{row['action_code']}" for row in rows]
    
    except Exception as e:
        # En caso de error, retornar lista vacía (sin permisos)
        # Esto es más seguro que fallar el login
        print(f"Error obteniendo permisos para role_id={role_id}: {e}")
        return []
