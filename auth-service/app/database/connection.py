import os
import sys
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config.config import load_config


def get_db_connection():
    """
    Construye la cadena de conexión para PostgreSQL y retorna la conexión.
    """
    config = load_config() or {}
    
    # Priority: Env Vars > Config File > Defaults
    host = os.getenv("POSTGRES_HOST") or config.get("host", "localhost")
    dbname = os.getenv("POSTGRES_DB") or config.get("dbname", "sim")
    user = os.getenv("POSTGRES_USER") or config.get("user", "admiSim")
    password = os.getenv("POSTGRES_PASSWORD") or config.get("password", "password")
    port = os.getenv("POSTGRES_PORT") or config.get("port", 5432)

    print(f"[AUTH-DB] Connecting: host={host}, db={dbname}, user={user}, port={port}", flush=True)

    try:
        conn = psycopg2.connect(
            host=host,
            dbname=dbname,
            user=user,
            password=password,
            port=port,
            cursor_factory=RealDictCursor
        )
        print(f"SUCCESS: DB Connected as user: {user} on database: {dbname}", flush=True)
        return conn
    except Exception as e:
        # On Spanish Windows, psycopg2 errors contain Windows-1252 chars
        # that crash Python's str() with UnicodeDecodeError
        try:
            err_msg = str(e)
        except Exception:
            err_msg = e.__class__.__name__ + " (msg contains non-utf8 chars)"
        print(f"FAILED: [AUTH-DB] Connection failed: {err_msg}", file=sys.stderr, flush=True)
        raise Exception("No se pudo conectar a la base de datos: " + err_msg)
