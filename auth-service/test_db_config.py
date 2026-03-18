from app.config.config import load_config
from app.database.connection import get_db_connection

print("Loading config...")
config = load_config()
print("Config:", config)

print("\nTesting database connection...")
try:
    conn = get_db_connection()
    print("✓ Database connection successful!")
    with conn.cursor() as cur:
        cur.execute("SELECT version();")
        version = cur.fetchone()
        print(f"PostgreSQL version: {version}")
    conn.close()
except Exception as e:
    print(f"✗ Database connection failed: {e}")
