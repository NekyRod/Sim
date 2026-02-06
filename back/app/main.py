from fastapi import FastAPI
from app.routes import (
    pacientes_routes, 
    citas_routes, 
    profesionales_routes, 
    disponibilidades_routes,
    tiposidentificacion_routes,
    ciudadesresidencia_routes,  
    tiposservicio_routes,       
    tipospbs_routes,
    prenombres_routes,          # ← NUEVO
    especialidades_routes,      # ← NUEVO
    profesionales_routes,
    festivos_routes,
    rangos_bloqueados_routes
) 
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings 

app = FastAPI(
    title="API Centro Médico",
    description="API REST para sistema de gestión de centro médico",
    version="1.0.0"
    )
origins = [
   settings.FRONTEND_URL,  # Vite
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(pacientes_routes.router)
app.include_router(citas_routes.router)
app.include_router(tiposidentificacion_routes.router) 
app.include_router(ciudadesresidencia_routes.router)
app.include_router(tiposservicio_routes.router)
app.include_router(tipospbs_routes.router)
app.include_router(profesionales_routes.router)
app.include_router(prenombres_routes.router)        # ← NUEVO
app.include_router(especialidades_routes.router)    # ← NUEVO
app.include_router(disponibilidades_routes.router)
app.include_router(festivos_routes.router)
app.include_router(rangos_bloqueados_routes.router)
