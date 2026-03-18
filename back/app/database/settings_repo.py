from app.database.connection import get_db_connection

def get_smtp_settings():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            cur.execute("""
                SELECT host, port, username, password_encrypted, 
                       from_email, from_name, use_tls, use_ssl, 
                       timeout_seconds, enabled, updated_at, updated_by
                FROM smtp_settings
                LIMIT 1
            """)
            row = cur.fetchone()
            if not row: return None
            return {
                "host": row[0],
                "port": row[1],
                "username": row[2],
                "password_encrypted": row[3],
                "from_email": row[4],
                "from_name": row[5],
                "use_tls": row[6],
                "use_ssl": row[7],
                "timeout_seconds": row[8],
                "enabled": row[9],
                "updated_at": str(row[10]),
                "updated_by": row[11]
            }
    finally:
        conn.close()

def save_smtp_settings(data: dict, updated_by: str):
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            # Check if exists
            cur.execute("SELECT count(*) FROM smtp_settings")
            count = cur.fetchone()[0]
            
            if count == 0:
                cur.execute("""
                    INSERT INTO smtp_settings 
                    (host, port, username, password_encrypted, from_email, from_name,
                     use_tls, use_ssl, timeout_seconds, enabled, updated_by, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                """, (
                    data['host'], data['port'], data.get('username'), data.get('password_encrypted'),
                    data.get('from_email'), data.get('from_name'), 
                    data.get('use_tls', True), data.get('use_ssl', False),
                    data.get('timeout_seconds', 30), data.get('enabled', False),
                    updated_by
                ))
            else:
                cur.execute("""
                    UPDATE smtp_settings
                    SET host=%s, port=%s, username=%s, password_encrypted=%s,
                        from_email=%s, from_name=%s, use_tls=%s, use_ssl=%s,
                        timeout_seconds=%s, enabled=%s, updated_by=%s, updated_at=CURRENT_TIMESTAMP
                """, (
                    data['host'], data['port'], data.get('username'), data.get('password_encrypted'),
                    data.get('from_email'), data.get('from_name'), 
                    data.get('use_tls', True), data.get('use_ssl', False),
                    data.get('timeout_seconds', 30), data.get('enabled', False),
                    updated_by
                ))
            conn.commit()
            return True
    finally:
        conn.close()
