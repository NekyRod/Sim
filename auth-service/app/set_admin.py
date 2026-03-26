import bcrypt
import psycopg2
import os

try:
    conn = psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "host.docker.internal"),
        dbname=os.getenv("POSTGRES_DB", "goi"),
        user=os.getenv("POSTGRES_USER", "admisim"),
        password=os.getenv("POSTGRES_PASSWORD", "G0i_AdM1n#2026"),
        port=5432
    )
    cur = conn.cursor()
    hashed = bcrypt.hashpw(b"password123", bcrypt.gensalt()).decode("utf-8")
    
    cur.execute("SELECT 1 FROM usuarios WHERE username='admin'")
    if cur.fetchone():
        cur.execute("UPDATE usuarios SET password_hash=%s, rol='admin', activo=true WHERE username='admin'", (hashed,))
    else:
        cur.execute("INSERT INTO usuarios (username, password_hash, rol, activo) VALUES ('admin', %s, 'admin', true)", (hashed,))
    conn.commit()
    print("Admin user configured successfully!")
except Exception as e:
    print(f"Error: {e}")
