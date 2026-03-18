from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from app.auth.dependencies import get_current_user
from app.control import chat_control
from app.database import chat_repo
from app.database.connection import get_db_connection

router = APIRouter(
    prefix="/patient/chat",
    tags=["ChatBot Patient"]
    # No auth dependency for the router itself
)

# Request Models
class MessageRequest(BaseModel):
    content: str

class SessionStartRequest(BaseModel):
    session_id: Optional[int] = None
    name: Optional[str] = None
    documento: Optional[str] = None

# Routes

@router.post("/sessions")
def start_session(body: SessionStartRequest = None):
    """Start or retrieve active chat session (Anonymous or Resumed)"""
    sid = body.session_id if body else None
    name = body.name if body else None
    doc = body.documento if body else None
    
    # We don't have patient_id for anonymous users initially
    session = chat_control.create_or_get_session(patient_id=None, session_id=sid, name=name, documento=doc)
    return {"session_id": session["id"], "status": session["status"]}

@router.post("/sessions/{session_id}/messages")
def send_message(session_id: int, body: MessageRequest, background_tasks: BackgroundTasks):
    """Send message to bot"""
    # Verify session exists
    session = chat_repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if closed?
    if session['status'] == 'closed':
         # Maybe allow to reopen? For now control handles it.
         pass

    chat_control.handle_patient_message(session_id, body.content, background_tasks)
    return {"status": "Message processed"}

@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: int):
    """Get message history"""
    session = chat_repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    msgs = chat_repo.get_messages(session_id, limit=100, target="patient")
    return msgs

@router.post("/sessions/{session_id}/close")
def close_session(session_id: int):
    """Patient ends the chat"""
    # Verify session exists (patient_id check?)
    # For now, if they have the ID, they can close it. 
    # ideally we check if cookie matches but we are using localStorage ID approach.
    session = chat_repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    chat_repo.update_session_state(session_id, "FINAL", "TERMINATED", {}, "closed")
    return {"status": "closed"}
