# app/security.py
from typing import Annotated
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
