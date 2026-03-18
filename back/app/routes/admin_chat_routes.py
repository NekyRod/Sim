from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List

from app.auth.dependencies import get_current_user
from app.control import chat_control
from app.database import chat_repo

router = APIRouter(
    prefix="/chat",
    tags=["ChatBot Admin"],
    dependencies=[Depends(get_current_user)] 
)

# Request Models
class ValidateRequest(BaseModel):
    accion: str  # ACTIVO | NO_ACTIVO

class CloseRequest(BaseModel):
    reason: Optional[str] = None

# Routes

@router.get("/sessions")
def list_sessions(status: Optional[str] = None):
    return chat_repo.get_all_sessions(status)

@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: int):
    return chat_repo.get_messages(session_id, limit=100, target="admin")

@router.post("/sessions/{session_id}/validate")
def validate_patient(session_id: int, body: ValidateRequest):
    if body.accion not in ["ACTIVO", "NO_ACTIVO"]:
        raise HTTPException(status_code=400, detail="Invalid action. Use ACTIVO or NO_ACTIVO")
    
    is_active = (body.accion == "ACTIVO")
    chat_control.validate_session(session_id, is_active)
    return {"status": "processed"}

@router.post("/sessions/{session_id}/close")
def close_session(session_id: int, body: CloseRequest):
    # Just update status
    chat_repo.update_session_state(session_id, "FINAL", "TERMINATED", {}, "closed")
    chat_repo.update_session_state(session_id, "FINAL", "TERMINATED", {}, "closed")
    return {"status": "closed"}

class DeleteSessionsRequest(BaseModel):
    session_ids: List[int]

@router.delete("/sessions")
def delete_sessions(body: DeleteSessionsRequest):
    chat_control.delete_sessions(body.session_ids)
    return {"status": "deleted"}

class MessageRequest(BaseModel):
    content: str

# ... (keep existing classes)

@router.post("/sessions/{session_id}/messages")
def send_admin_message(session_id: int, body: MessageRequest):
    # Verify session exists
    session = chat_repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Add message as receptionist
    chat_repo.add_message(session_id, "receptionist", body.content)
    return {"status": "sent"}

@router.get("/notifications")
def get_notifications():
    # Helper to get current user ID
    # Assume user ID is in payload['sub'] or similar if int?
    # Or just return all unread for now as broadcast?
    # The requirement says "user_id (recepcionista/admin)".
    # Let's return all unread notifications since receptionists share queue usually.
    return chat_repo.get_unread_notifications(user_id=None)

@router.post("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    chat_repo.mark_notification_read(notification_id)
    return {"status": "read"}

@router.post("/notifications/clear")
def clear_notifications():
    chat_repo.mark_all_notifications_read(user_id=None)
    return {"status": "cleared"}
