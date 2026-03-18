---
description: Start all SIM-ODONT services (Backend 8002, Auth 8000, Frontend)
---

// turbo-all

1. Start the Backend Service (Port 8002)
   `d:/OneDrive/Desarr/Proyectos/GOI/back/venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload`

2. Start the Auth Service (Port 8000)
   `d:/OneDrive/Desarr/Proyectos/GOI/auth-service/venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000`

3. Start the Frontend
   `cd d:/OneDrive/Desarr/Proyectos/GOI/front/sim-agenda-web && npm run dev`
