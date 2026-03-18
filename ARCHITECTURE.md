# WolfArena / WolfTracer - Reglas de Arquitectura (OBLIGATORIAS)

Este repositorio se desarrolla con:
- Front: React (Vite) + Tailwind
- Back: FastAPI (Python) + PostgreSQL
- Arquitectura: Microservicios + arquitectura por capas dentro de cada servicio

Estas reglas SON OBLIGATORIAS. Cualquier código nuevo o refactor debe respetarlas.

---

## 1) Arquitectura por microservicios

### Servicios principales
- auth-service (FastAPI): autenticación y emisión/verificación de JWT
- back (FastAPI): API del dominio (cases/challenges, companies, etc.)

### Reglas
- Cada servicio tiene su propia carpeta, dependencias y ejecución.
- NO mezclar lógicas de auth dentro del servicio back: back SOLO valida token vía dependencia.
- El front habla con back y auth-service mediante HTTP, usando token Bearer.

---

## 2) Autenticación (JWT Bearer Token)

### Contrato
- El token se envía SIEMPRE como:
  Authorization: Bearer <JWT>

### En back (servicio API)
- Las rutas protegidas usan `Depends(get_current_user_token)`.
- La validación del token se centraliza en `app/auth/dependencies.py`.
- NO replicar validación de token en cada endpoint.
- Si el endpoint es público, se define explícitamente (sin Depends).

---

## 3) Arquitectura por capas (OBLIGATORIA) dentro de cada microservicio

### Capas
1) Routes (app/routes/*_routes.py)
2) Control (app/control/*_control.py)
3) Repo (app/database/*_repo.py)

### 3.1 Routes (FastAPI)
✅ Permitido:
- APIRouter, endpoints
- Depends (auth)
- Request/Response básicos
- Pydantic models (o imports desde schemas)
- Llamar funciones del Control

❌ Prohibido:
- SQL, psycopg2, cursores
- get_db_connection / connection
- lógica de negocio (mapeos complejos, reglas)
- transformar shape de respuesta (eso va en Control)

**Routes = “capa HTTP” solamente.**

---

### 3.2 Control (Lógica de negocio)
✅ Permitido:
- Validaciones de negocio
- Mapeos de salida (shape que consume React)
- Cálculos, reglas, ensamblar payloads compuestos
- Lanzar `HTTPException`
- Llamar al Repo

❌ Prohibido:
- SQL y conexiones directas
- psycopg2 y cursores

**Control = “cerebro”.**

---

### 3.3 Repo (Acceso a datos)
✅ Permitido:
- SQL (CRUD)
- `get_db_connection()`
- `RealDictCursor`
- Retornar rows/dicts simples

❌ Prohibido:
- FastAPI / APIRouter / Depends
- `HTTPException` (las decisiones de error viven en Control)
- importar cosas desde Routes

**Repo = “DB only”.**

---

## 4) Naming convention (OBLIGATORIA)

Para un módulo `<name>`:
- app/routes/<name>_routes.py
- app/control/<name>_control.py
- app/database/<name>_repo.py
- (opcional recomendado) app/schemas/<name>_schemas.py

Los routers SIEMPRE exponen `router`.

Ejemplo:
cases_routes.py -> cases_control.py -> cases_repo.py

---

## 5) Contratos de API y consistencia con Front

- NO cambiar paths ni payloads sin actualizar front.
- Los shapes “HTB-style” (timers/kpis/objectives/etc.) se generan en CONTROL.
- Repo devuelve data normalizada (row dict), Control adapta a la UI.

---

## 6) Buenas prácticas del repo

- Commits pequeños y frecuentes.
- Cambios grandes siempre en rama `test/*`, merge a `main` cuando esté estable.
- `.env` y secretos NO se suben al repo.
- Si hay OneDrive sync, Git sigue siendo la fuente de verdad.

---

## 7) Checklist obligatorio antes de entregar un cambio

Antes de dar por terminado un PR/refactor:
- [ ] Routes no importa psycopg2 ni connection
- [ ] Control no tiene SQL
- [ ] Repo no importa FastAPI
- [ ] Endpoints protegidos tienen Depends(get_current_user_token)
- [ ] No se rompió el shape que consume React

---

## 8) Entorno de ejecución (OBLIGATORIO)

### Python / FastAPI
- Todos los servicios FastAPI se ejecutan dentro de un entorno virtual (`venv`).
- NUNCA se ejecuta uvicorn fuera del venv.

Ejemplo correcto:
```bash
source venv/bin/activate   # Linux / Mac
.\venv\Scripts\Activate.ps1  # Windows PowerShell
uvicorn app.main:app --reload
