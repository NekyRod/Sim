from app.database.connection import get_db_connection

print("Checking users in database...")
try:
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT username, rol, activo FROM usuarios WHERE activo = TRUE;")
            users = cur.fetchall()
            print(f"\nFound {len(users)} active users:")
            for user in users:
                print(f"  - Username: {user['username']}, Role: {user['rol']}, Active: {user['activo']}")
except Exception as e:
    print(f"✗ Error: {e}")
