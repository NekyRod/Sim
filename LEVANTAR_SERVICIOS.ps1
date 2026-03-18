Write-Host "Levantando servicios SIM-ODONT..."
Write-Host "Se abrirán 3 ventanas nuevas, una para cada servicio."

# Start Backend
Write-Host "Iniciando Backend (Port 8002)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:/OneDrive/Desarr/Proyectos/GOI/back'; ./venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8002 --reload"

# Start Auth Service
Write-Host "Iniciando Auth Service (Port 8000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:/OneDrive/Desarr/Proyectos/GOI/auth-service'; ./venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

# Start Frontend
Write-Host "Iniciando Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:/OneDrive/Desarr/Proyectos/GOI/front/sim-agenda-web'; npm run dev"

Write-Host "Proceso completado."
