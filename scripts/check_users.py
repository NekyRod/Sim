import psycopg2
import os

# Config from app.conf (decrypted previously)
DB_HOST = "localhost"
DB_NAME = "sim"
DB_USER = "admiSim"
DB_PASS = "0728" # Updated password

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )
    cur = conn.cursor()
    
    # Check users
    try:
        cur.execute("SELECT count(*) FROM usuarios;")
        count = cur.fetchone()[0]
        print(f"Usuarios en DB: {count}")
        if count > 0:
            cur.execute("SELECT username, rol FROM usuarios LIMIT 5;")
            users = cur.fetchall()
            for u in users:
                print(f"User: {u[0]}, Role: {u[1]}")
        else:
            print("No hay usuarios. Se intentará crear uno de prueba.")
            # Create test user if none
            # We need to know the schema for users. 
            # Assuming username, password, etc.
            # But password usually needs hashing.
            pass
            
    except Exception as e:
        print(f"Error querying users: {e}")
        
    conn.close()
    
except Exception as e:
    print(f"Error connecting to DB: {e}")
