import logging
import traceback
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.logging_config import setup_logging
from app.routes.auth_routes import router as auth_router
from app.config.user_admin import router as user_admin_router
from app.config.settings import settings

# ── Logging ──────────────────────────────────────────
logger = setup_logging()

# ── App ──────────────────────────────────────────────
app = FastAPI(title="Auth Service")

# ── CORS ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor. Contacte al administrador.",
            "error_id": error_id,
        },
    )


# ── Lifecycle events ────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("Auth Service iniciado — puerto 8000")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "auth-service"}


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
app.include_router(auth_router)
app.include_router(user_admin_router)

logger.info("Auth Service: rutas registradas correctamente")
