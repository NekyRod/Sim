import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import get_db_connection

def init_smtp_table():
    conn = get_db_connection()
    try:
        with conn, conn.cursor() as cur:
            print("Creating smtp_settings table if not exists...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS smtp_settings (
                    id SERIAL PRIMARY KEY,
                    host VARCHAR(255) NOT NULL,
                    port INTEGER NOT NULL,
                    username VARCHAR(255),
                    password_encrypted TEXT,
                    from_email VARCHAR(255),
                    from_name VARCHAR(255),
                    use_tls BOOLEAN DEFAULT TRUE,
                    use_ssl BOOLEAN DEFAULT FALSE,
                    timeout_seconds INTEGER DEFAULT 30,
                    enabled BOOLEAN DEFAULT FALSE,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_by VARCHAR(255)
                );
            """)
            
            # Check if empty, maybe insert default row?
            cur.execute("SELECT count(*) FROM smtp_settings")
            count = cur.fetchone()[0]
            if count == 0:
                print("Inserting default empty row...")
                cur.execute("""
                    INSERT INTO smtp_settings (host, port, enabled) 
                    VALUES ('smtp.example.com', 587, FALSE)
                """)
            
            conn.commit()
            print("Table smtp_settings ready.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    init_smtp_table()
