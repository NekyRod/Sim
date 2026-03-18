# Instrucciones para Levantar Servicios

Para evitar problemas de puertos y dependencias, y asegurar que se use el entorno virtual correcto, utiliza los siguientes comandos.

También puedes ejecutar el script `LEVANTAR_SERVICIOS.ps1` (clic derecho -> Ejecutar con PowerShell) para abrir todo automáticamente.

## 1. Backend (Puerto 8001)

El backend principal debe correr en el puerto 8001 usando su propio entorno virtual.

```powershell
D:/OD/OneDrive/Desarr/Wolfgis/GOI/back/venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 2. Auth Service (Puerto 8000)

El servicio de autenticación debe correr en el puerto 8000 usando su propio entorno virtual.
**Nota:** El Auth Service se ejecuta sin `--reload` para mayor estabilidad.

```powershell
D:/OD/OneDrive/Desarr/Wolfgis/GOI/auth-service/venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 3. Frontend

El frontend se levanta con Vite (normalmente puerto 5173).

```powershell
cd D:/OD/OneDrive/Desarr/Wolfgis/GOI/front/sim-agenda-web
npm run dev
```

---

**Recursos del Agente AI:**

- Workflow: `.agent/workflows/restart_services.md`
