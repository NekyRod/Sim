"""
Configuración centralizada de logging para el Backend.

- En servidor (Docker/EC2): logs estructurados con timestamp, nivel y módulo.
- El usuario final NUNCA ve stack traces ni errores de código.
- Los errores quedan en stdout/stderr para Docker logs o CloudWatch.
"""

import logging
import sys
import os


def setup_logging() -> logging.Logger:
    """
    Configura el logging raíz de la aplicación.
    
    Returns:
        Logger principal de la app.
    """
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    # Formato estructurado: timestamp | nivel | módulo | mensaje
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Handler a stdout (Docker captura esto con `docker logs`)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # Configurar logger raíz
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    # Evitar duplicar handlers si se llama más de una vez
    if not root_logger.handlers:
        root_logger.addHandler(handler)

    # Reducir ruido de librerías externas
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)

    logger = logging.getLogger("backend")
    logger.info("Logging configurado — nivel: %s", log_level)
    return logger
