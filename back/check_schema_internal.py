import sys
import os

# Add backend path to sys.path
sys.path.append(os.getcwd())

try:
    from app.database.connection import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if es_autogestion exists
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'especialidades' AND column_name = 'es_autogestion';")
    result = cur.fetchone()
    
    if result:
        print("COLUMN_OK: column 'es_autogestion' exists in table 'especialidades'")
        # Check values
        cur.execute("SELECT nombre, es_autogestion FROM especialidades WHERE activo = TRUE")
        rows = cur.fetchall()
        print(f"Found {len(rows)} active specialties.")
        for r in rows:
            print(f"- {r[0]}: {r[1]}")
    else:
        print("COLUMN_MISSING: column 'es_autogestion' NOT found!")
        
    conn.close()
except Exception as e:
    import traceback
    traceback.print_exc()
