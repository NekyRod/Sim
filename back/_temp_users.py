"""Get users - write to file"""
import psycopg2
from app.config.config import load_config
import os

config = load_config() or {}
host = os.getenv("POSTGRES_HOST") or config.get("host", "localhost")
dbname = os.getenv("POSTGRES_DB") or config.get("dbname", "sim")
user = os.getenv("POSTGRES_USER") or config.get("user", "postgres")
password = os.getenv("POSTGRES_PASSWORD") or config.get("password", "password")
port = os.getenv("POSTGRES_PORT") or config.get("port", 5432)

conn = psycopg2.connect(host=host, dbname=dbname, user=user, password=password, port=port)
cur = conn.cursor()

cur.execute("""
    SELECT u.id, u.username, u.password_hash, u.rol, u.activo, r.name as role_name
    FROM usuarios u 
    LEFT JOIN roles r ON u.role_id = r.id
    ORDER BY u.id
""")

with open("_users_output.txt", "w") as f:
    for r in cur.fetchall():
        f.write(f"ID={r[0]} | user={r[1]} | hash={r[2]} | rol={r[3]} | activo={r[4]} | role={r[5]}\n")

conn.close()
print("Done - see _users_output.txt")
