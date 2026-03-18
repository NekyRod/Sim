import os
import psycopg2
from app.config.config import load_config
import sys

def test_conn():
    config = load_config() or {}
    host = os.getenv("POSTGRES_HOST") or config.get("host", "localhost")
    dbname = os.getenv("POSTGRES_DB") or config.get("dbname", "sim")
    user = os.getenv("POSTGRES_USER") or config.get("user", "admiSim")
    password = os.getenv("POSTGRES_PASSWORD") or config.get("password", "password")
    port = os.getenv("POSTGRES_PORT") or config.get("port", 5432)

    print(f"DEBUG: host={host}, dbname={dbname}, user={user}, password={password}, port={port}")

    try:
        conn = psycopg2.connect(
            host=host,
            dbname=dbname,
            user=user,
            password=password,
            port=port
        )
        print("✅ Connection successful!")
        conn.close()
    except Exception as e:
        print(f"DEBUG: Exception type: {type(e)}")
        try:
            print(f"DEBUG: str(e) attempt...")
            msg = str(e)
            print(f"DEBUG: str(e) result: {msg}")
        except UnicodeDecodeError as ude:
            print(f"DEBUG: str(e) failed with UnicodeDecodeError: {ude}")
            print(f"DEBUG: repr(e) result: {repr(e)}")

if __name__ == "__main__":
    test_conn()
