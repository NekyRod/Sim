# app/config/user_admin.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt

from app.database.connection import get_db_connection

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


class UserCreate(BaseModel):
    username: str
    password: str
    rol: str = "USER"
    activo: bool = True


@router.post("")
def create_user(body: UserCreate):
    password_bytes = body.password.encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    password_hash = hashed.decode("utf-8")

    sql_check = "SELECT 1 FROM usuarios WHERE username = %s;"
    sql_insert = """
        INSERT INTO usuarios (username, password_hash, rol, activo)
        VALUES (%s, %s, %s, %s)
        RETURNING id, username, rol, activo;
    """

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql_check, (body.username,))
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="El usuario ya existe")

            cur.execute(
                sql_insert,
                (body.username, password_hash, body.rol, body.activo),
            )
            user = cur.fetchone()
            conn.commit()

    return dict(user)


@router.get("")
def list_users():
    sql = "SELECT id, username, rol, activo FROM usuarios ORDER BY id;"
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    return [
        {
            "id": r["id"],
            "username": r["username"],
            "rol": r["rol"],
            "activo": r["activo"],
        }
        for r in rows
    ]

