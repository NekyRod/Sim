"""
Servicio de gestión de Usuarios

Este módulo proporciona la lógica de negocio para CRUD de usuarios,
asignación de roles y gestión de contraseñas con seguridad.
"""
from typing import List, Dict, Any, Optional
from psycopg2.extras import RealDictCursor
from app.database.connection import get_db_connection
from app.utils.security_utils import password_hasher


class UserService:
    """Servicio para gestión de Usuarios"""
    
    @staticmethod
    def get_all_users() -> List[Dict[str, Any]]:
        """
        Lista todos los usuarios con su rol asignado.
        
        Returns:
            Lista de usuarios con metadatos y nombre de rol
        """
        sql = """
            SELECT u.id, u.username, u.activo, u.creado_en,
                   r.id as role_id, r.name as role_name
            FROM usuarios u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.activo = TRUE
            ORDER BY u.creado_en DESC
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql)
                return cur.fetchall()
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        """
        Obtiene un usuario por ID con su información de rol.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con datos del usuario o None si no existe
        """
        sql = """
            SELECT u.id, u.username, u.activo, u.creado_en,
                   r.id as role_id, r.name as role_name
            FROM usuarios u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = %s
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (user_id,))
                return cur.fetchone()
    
    @staticmethod
    def create_user(username: str, password: str, role_id: int) -> Dict[str, Any]:
        """
        Crea un nuevo usuario con contraseña hasheada usando Bcrypt.
        
        Args:
            username: Nombre de usuario único
            password: Contraseña en texto plano (será hasheada)
            role_id: ID del rol a asignar
            
        Returns:
            Diccionario con los datos del usuario creado (sin password_hash)
            
        Raises:
            Exception: Si el username ya existe o hay error en DB
        """
        # Hashear contraseña con Bcrypt antes de almacenar
        password_hash = password_hasher.hash_password(password)
        
        # Obtener nombre del rol para columna legacy 'rol'
        role_name = "custom"
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT name FROM roles WHERE id = %s", (role_id,))
                res = cur.fetchone()
                if res and res[0]:
                    role_name = res[0]

        sql = """
            INSERT INTO usuarios (username, password_hash, role_id, rol, activo)
            VALUES (%s, %s, %s, %s, TRUE)
            RETURNING id, username, role_id, activo, creado_en
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (username, password_hash, role_id, role_name))
                user = cur.fetchone()
                conn.commit()
                return user
    
    @staticmethod
    def update_user_role(user_id: int, role_id: int) -> Dict[str, Any]:
        """
        Actualiza el rol asignado a un usuario.
        
        Args:
            user_id: ID del usuario a actualizar
            role_id: ID del nuevo rol
            
        Returns:
            Diccionario con los datos actualizados del usuario
            
        Raises:
            ValueError: Si el usuario no existe
        """
        sql = """
            UPDATE usuarios 
            SET role_id = %s
            WHERE id = %s
            RETURNING id, username, role_id, activo
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (role_id, user_id))
                user = cur.fetchone()
                if not user:
                    raise ValueError("Usuario no encontrado")
                conn.commit()
                return user
    
    @staticmethod
    def change_password(user_id: int, new_password: str) -> None:
        """
        Cambia la contraseña de un usuario.
        La nueva contraseña es hasheada automáticamente con Bcrypt.
        
        Args:
            user_id: ID del usuario
            new_password: Nueva contraseña en texto plano
            
        Raises:
            ValueError: Si la contraseña está vacía
        """
        # Hashear nueva contraseña
        password_hash = password_hasher.hash_password(new_password)
        
        sql = "UPDATE usuarios SET password_hash = %s WHERE id = %s RETURNING id"
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (password_hash, user_id))
                if not cur.fetchone():
                    raise ValueError("Usuario no encontrado")
                conn.commit()
    
    @staticmethod
    def toggle_user_status(user_id: int) -> Dict[str, Any]:
        """
        Activa o desactiva un usuario (alterna el estado actual).
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario con los datos del usuario actualizado
        """
        sql = """
            UPDATE usuarios 
            SET activo = NOT activo
            WHERE id = %s
            RETURNING id, username, activo, creado_en
        """
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(sql, (user_id,))
                user = cur.fetchone()
                if not user:
                    raise ValueError("Usuario no encontrado")
                conn.commit()
                return user
    
    @staticmethod
    def delete_user(user_id: int) -> None:
        """
        Elimina permanentemente un usuario de la base de datos.
        
        Args:
            user_id: ID del usuario a eliminar
            
        Raises:
            ValueError: Si el usuario no existe o tiene dependencias (foreign keys)
        """
        sql = "DELETE FROM usuarios WHERE id = %s RETURNING id"
        with get_db_connection() as conn:
            try:
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(sql, (user_id,))
                    if not cur.fetchone():
                        raise ValueError("Usuario no encontrado")
                    conn.commit()
            except Exception as e:
                # Si hay error de llave foránea (IntegrityError en psycopg2)
                if "foreign key" in str(e).lower() or "llave foránea" in str(e).lower():
                    raise ValueError("No se puede eliminar este usuario porque tiene actividad o registros asociados. Pruebe a desactivarlo en su lugar.")
                raise e
