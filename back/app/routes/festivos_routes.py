
from fastapi import APIRouter, Depends
from app.control import festivos_control
from app.config.security import get_current_user_token
from pydantic import BaseModel

router = APIRouter(
    prefix="/festivos",
    tags=["festivos"],
    dependencies=[Depends(get_current_user_token)]
)

class FestivoRequest(BaseModel):
    fecha: str
    descripcion: str = ""

@router.get("/")
def get_festivos():
    return festivos_control.obtener_festivos()

@router.post("/")
def create_festivo(body: FestivoRequest):
    return festivos_control.registrar_festivo(body.dict())

@router.delete("/{id}")
def delete_festivo(id: int):
    return festivos_control.borrar_festivo(id)
