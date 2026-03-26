import logging
import traceback
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.logging_config import setup_logging
from app.routes import (
    pacientes_routes, 
    citas_routes, 
    profesionales_routes, 
    disponibilidades_routes,
    tiposidentificacion_routes,
    ciudadesresidencia_routes,  
    tiposservicio_routes,       
    tipospbs_routes,
    prenombres_routes,
    especialidades_routes,
    festivos_routes,
    rangos_bloqueados_routes,
    chat_routes,
    admin_chat_routes,
    anamnesis_routes,
    roles_routes,
    users_routes,
    informes_routes,
    alertas_routes,
    odontograma_routes,
    procedimientos_routes,
    evoluciones_routes,
    recetas_routes,
    documentos_routes,
    consultas_routes,
    tarifas_routes,
)
from app.routes import patient_api_routes

try:
    from app.routes import settings_routes
except ImportError:
    settings_routes = None

from app.config.settings import settings

# ── Logging ──────────────────────────────────────────
logger = setup_logging()

# ── App ──────────────────────────────────────────────
app = FastAPI(
    title="API Centro Médico",
    description="API REST para sistema de gestión de centro médico",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:5173",
        "http://localhost:80",
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:8002",
        "http://127.0.0.1:80",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8001",
        "http://127.0.0.1:8002",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═════════════════════════════════════════════════════
# GLOBAL EXCEPTION HANDLER
# ═════════════════════════════════════════════════════
# Captura CUALQUIER excepción no manejada.
# → Server-side: loguea el traceback completo con un error_id rastreable.
# → Client-side: devuelve un JSON genérico SIN información interna.
# ═════════════════════════════════════════════════════

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_id = uuid.uuid4().hex[:12]
    logger.error(
        "ERROR_ID=%s | %s %s | %s: %s\n%s",
        error_id,
        request.method,
        request.url.path,
        type(exc).__name__,
        str(exc),
        traceback.format_exc(),
    )
    headers = {
        "Access-Control-Allow-Origin": request.headers.get("origin", "http://localhost"),
        "Access-Control-Allow-Credentials": "true",
    }
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor. Contacte al administrador.",
            "error_id": error_id,
        },
        headers=headers
    )


# ── Lifecycle events ────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("Backend API iniciado — puerto 8001")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "backend"}


# ── Request logging middleware ───────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug("%s %s", request.method, request.url.path)
    response = await call_next(request)
    if response.status_code >= 400:
        logger.warning(
            "%s %s → %d", request.method, request.url.path, response.status_code
        )
    return response


# ── Routers ──────────────────────────────────────────
app.include_router(pacientes_routes.router)
app.include_router(citas_routes.router)
app.include_router(tiposidentificacion_routes.router)
app.include_router(ciudadesresidencia_routes.router)
app.include_router(tiposservicio_routes.router)
app.include_router(tipospbs_routes.router)
app.include_router(profesionales_routes.router)
app.include_router(prenombres_routes.router)
app.include_router(especialidades_routes.router)
app.include_router(disponibilidades_routes.router)
app.include_router(festivos_routes.router)
app.include_router(rangos_bloqueados_routes.router)
app.include_router(admin_chat_routes.router)
app.include_router(chat_routes.router)
app.include_router(patient_api_routes.router)
app.include_router(anamnesis_routes.router)
app.include_router(roles_routes.router)
app.include_router(users_routes.router)
app.include_router(informes_routes.router)
app.include_router(alertas_routes.router)
app.include_router(odontograma_routes.router)
app.include_router(procedimientos_routes.router)
app.include_router(evoluciones_routes.router)
app.include_router(recetas_routes.router)
app.include_router(documentos_routes.router)
app.include_router(consultas_routes.router)
app.include_router(tarifas_routes.router)

if settings_routes:
    logger.info("Settings routes cargadas correctamente")
    app.include_router(settings_routes.router)
else:
    logger.warning("Settings routes NO disponibles (import falló)")
