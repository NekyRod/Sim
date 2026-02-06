import psycopg2
from app.config.config import load_config


def get_db_connection():
    """
    Construye la cadena de conexión para PostgreSQL y retorna la conexión.
    """
    config = load_config() or {}
    host = config.get("host", "localhost")
    dbname = config.get("dbname", "mydatabase")
    user = config.get("user", "postgres")
    password = config.get("password", "password")
    port = config.get("port", 5432)

    try:
        conn = psycopg2.connect(
            host=host,
            dbname=dbname,
            user=user,
            password=password,
            port=port
        )
        return conn
    except Exception as e:
        raise Exception("No se pudo conectar a la base de datos: " + str(e))
