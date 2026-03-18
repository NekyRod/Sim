from fastapi import APIRouter, Depends, HTTPException, Body
from app.control import settings_control
from app.auth.dependencies import get_current_user

print("LOADING SETTINGS ROUTES MODULE")

router = APIRouter(
    prefix="/admin/settings",
    tags=["Admin Settings"],
    dependencies=[Depends(get_current_user)] 
    # TODO: Add role check specifically for infra/admin
)

@router.get("/smtp")
def get_smtp_config(user=Depends(get_current_user)):
    # Check role
    # Assuming user payload has 'role' or similar. 
    # For now allow authenticated users or check specific claim if implemented.
    return settings_control.get_settings_masked()

@router.put("/smtp")
def update_smtp_config(data: dict = Body(...), user=Depends(get_current_user)):
    username = user.get("sub", "admin") # fallback
    settings_control.update_settings(data, username)
    return {"message": "Configuración guardada"}

@router.post("/smtp/test")
def test_smtp(data: dict = Body(...), user=Depends(get_current_user)):
    email = data.get("email")
    if not email:
        raise HTTPException(400, "Email required")
    return settings_control.test_smtp_connection(email)

print(f"SETTINGS ROUTER ROUTES: {router.routes}", flush=True)
