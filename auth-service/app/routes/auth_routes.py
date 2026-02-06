from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt
import jwt
from datetime import datetime, timedelta
from app.config.settings import settings
from app.database.connection import get_db_connection as get_connection

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/token")
def login(body: LoginRequest):
    sql = "SELECT * FROM usuarios WHERE username = %s AND activo = TRUE;"
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (body.username,))
            user = cur.fetchone()
    if not user:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # asumiendo cursor dict (RealDictCursor); si es tupla, ajusta índices
    stored_hash = user["password_hash"]
    ok = bcrypt.checkpw(body.password.encode("utf-8"), stored_hash.encode("utf-8"))

    if not ok:
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
    payload = {
        "sub": user["username"],
        "rol": user["rol"],
        "exp": datetime.utcnow() + timedelta(hours=8)
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}
