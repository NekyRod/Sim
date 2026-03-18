"""
Servicio de gestión de Roles y Permisos

Este módulo proporciona la lógica de negocio para CRUD de roles,
asignación de permisos y consultas de metadatos del sistema de permisos.
"""
from typing import List, Dict, Any, Optional
from psycopg2.extras import RealDictCursor
from app.database.connection import get_db_connection


class RoleService:
    """Servicio para gestión de Roles y Permisos"""
    
    @staticmethod
    def get_all_roles() -> List[Dict[str, Any]]:
        """
        Lista todos los roles activos con conteo de permisos.
        
        Returns:
            Lista de roles con sus metadatos y número de permisos asignados
        """
        sql = """
            SELECT r.id, r.name, r.description, r.is_system, r.active,
                   r.created_at, r.updated_at,
                   COUNT(rp.id) as permission_count
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            WHERE r.active = TRUE
            GROUP BY r.id
            ORDER BY r.is_system DESC, r.name
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql)
                return cur.fetchall()
    
    @staticmethod
    def get_role_by_id(role_id: int) -> Optional[Dict[str, Any]]:
        """
        Obtiene un rol por ID incluyendo todos sus permisos detallados.
        
        Args:
            role_id: ID del rol a consultar
            
        Returns:
            Diccionario con datos del rol y lista de permisos,
            o None si no existe el rol
        """
        sql_role = "SELECT * FROM roles WHERE id = %s"
        sql_perms = """
            SELECT pg.id as group_id, pg.code as group_code, pg.name as group_name,
                   a.id as action_id, a.code as action_code, a.name as action_name
            FROM role_permissions rp
            JOIN permission_groups pg ON rp.permission_group_id = pg.id
            JOIN actions a ON rp.action_id = a.id
            WHERE rp.role_id = %s
            ORDER BY pg.name, a.code
        """
        
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql_role, (role_id,))
                role = cur.fetchone()
                
                if not role:
                    return None
                
                cur.execute(sql_perms, (role_id,))
                permissions = cur.fetchall()
                
                role['permissions'] = permissions
                return role
    
    @staticmethod
    def create_role(name: str, description: str = None) -> Dict[str, Any]:
        """
        Crea un nuevo rol (no-sistema).
        
        Args:
            name: Nombre del rol
            description: Descripción opcional del rol
            
        Returns:
            Diccionario con los datos del rol creado
            
        Raises:
            Exception: Si hay error en la creación
        """
        sql = """
            INSERT INTO roles (name, description, is_system, active)
            VALUES (%s, %s, FALSE, TRUE)
            RETURNING id, name, description, is_system, active, created_at, updated_at
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (name, description))
                role = cur.fetchone()
                conn.commit()
                return role
    
    @staticmethod
    def update_role(role_id: int, name: str, description: str = None) -> Dict[str, Any]:
        """
        Actualiza nombre y descripción de un rol.
        Solo roles no-sistema pueden ser editados.
        
        Args:
            role_id: ID del rol a actualizar
            name: Nuevo nombre del rol
            description: Nueva descripción del rol
            
        Returns:
            Diccionario con los datos del rol actualizado
            
        Raises:
            ValueError: Si el rol no existe o es de sistema
        """
        sql = """
            UPDATE roles 
            SET name = %s, description = %s, updated_at = NOW()
            WHERE id = %s AND is_system = FALSE
            RETURNING id, name, description, is_system, active, created_at, updated_at
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (name, description, role_id))
                role = cur.fetchone()
                if not role:
                    raise ValueError("Rol no encontrado o es rol de sistema")
                conn.commit()
                return role
    
    @staticmethod
    def assign_permissions(
        role_id: int, 
        permissions: List[Dict[str, int]]  # [{'group_id': 1, 'action_id': 1}, ...]
    ) -> None:
        """
        Asigna permisos a un rol, reemplazando los existentes.
        
        Esta operación es atómica: elimina todos los permisos actuales
        y asigna los nuevos en una sola transacción.
        
        Args:
            role_id: ID del rol al que asignar permisos
            permissions: Lista de diccionarios con group_id y action_id
            
        Example:
            assign_permissions(2, [
                {'group_id': 1, 'action_id': 1},  # AGENDAMIENTO:view
                {'group_id': 1, 'action_id': 2},  # AGENDAMIENTO:create
            ])
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Verificar si es rol de sistema antes de proceder
                cur.execute("SELECT is_system FROM roles WHERE id = %s", (role_id,))
                role = cur.fetchone()
                if role and role['is_system']:
                    raise ValueError("No se pueden modificar los permisos de un rol de sistema")

                # Eliminar permisos existentes
                cur.execute("DELETE FROM role_permissions WHERE role_id = %s", (role_id,))
                
                # Insertar nuevos permisos
                if permissions:
                    sql = """
                        INSERT INTO role_permissions (role_id, permission_group_id, action_id)
                        VALUES (%s, %s, %s)
                    """
                    values = [(role_id, p['group_id'], p['action_id']) for p in permissions]
                    cur.executemany(sql, values)
                
                conn.commit()
    
    @staticmethod
    def delete_role(role_id: int) -> None:
        """
        Elimina un rol (soft delete).
        Solo roles no-sistema pueden ser eliminados.
        
        Args:
            role_id: ID del rol a eliminar
            
        Raises:
            ValueError: Si el rol es de sistema o no existe
        """
        sql = """
            UPDATE roles 
            SET active = FALSE, updated_at = NOW()
            WHERE id = %s AND is_system = FALSE
            RETURNING id
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (role_id,))
                role = cur.fetchone()
                if not role:
                    raise ValueError("Rol no encontrado o es rol de sistema")
                conn.commit()
    
    @staticmethod
    def get_permission_groups() -> List[Dict[str, Any]]:
        """
        Obtiene todos los grupos de permisos disponibles.
        
        Returns:
            Lista de grupos de permisos activos
        """
        sql = """
            SELECT id, code, name, description 
            FROM permission_groups 
            WHERE active = TRUE 
            ORDER BY name
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql)
                return cur.fetchall()
    
    @staticmethod
    def get_actions() -> List[Dict[str, Any]]:
        """
        Obtiene todas las acciones disponibles (view, create, edit, delete).
        
        Returns:
            Lista de acciones
        """
        sql = "SELECT id, code, name FROM actions ORDER BY id"
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql)
                return cur.fetchall()
