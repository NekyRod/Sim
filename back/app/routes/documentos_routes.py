
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
import os
import shutil
from datetime import datetime
from app.database.documentos_repo import DocumentosRepo
from pydantic import BaseModel

router = APIRouter(prefix="/pacientes", tags=["documentos"])

# Directorio de subida
UPLOAD_DIR = "static/uploads/documentos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class DocumentoUpdate(BaseModel):
    observaciones: Optional[str] = None

@router.get("/{paciente_id}/documentos")
def get_documentos(paciente_id: int):
    return DocumentosRepo.get_by_paciente(paciente_id)

@router.post("/{paciente_id}/documentos/upload")
async def upload_documento(
    paciente_id: int,
    tipo: str = Form(...),
    observaciones: Optional[str] = Form(None),
    profesional_id: Optional[int] = Form(None),
    registrado_por: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    # Generar nombre único
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"pac_{paciente_id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Guardar en BD
        data = {
            "paciente_id": paciente_id,
            "profesional_id": profesional_id,
            "tipo_documento": tipo,
            "nombre_archivo": file.filename,
            "url_archivo": f"/static/uploads/documentos/{filename}",
            "observaciones": observaciones,
            "registrado_por": registrado_por
        }
        return DocumentosRepo.create(data)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documentos/{documento_id}")
def delete_documento(documento_id: int):
    # Nota: Aquí ideally también borraríamos el archivo físico
    if DocumentosRepo.delete(documento_id):
        return {"message": "Documento eliminado"}
    raise HTTPException(status_code=404, detail="No encontrado")
