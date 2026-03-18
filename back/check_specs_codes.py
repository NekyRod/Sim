import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.connection import get_db_connection

conn = get_db_connection()
try:
    cur = conn.cursor()
    # Get all specialties
    cur.execute("SELECT id, codigo, nombre, activo FROM especialidades ORDER BY codigo")
    specs = cur.fetchall()
    
    with open('specs_codes_dump.txt', 'w', encoding='utf-8') as f:
        f.write("--- Especialidades en BD ---\n")
        for s in specs:
            f.write(f"ID: {s[0]} | Cod: '{s[1]}' | Nom: '{s[2]}' | Activo: {s[3]}\n")

        # Check professionals count per specialty code
        f.write("\n--- Conteo Profesionales por Codigo (Primary) ---\n")
        cur.execute("""
            SELECT e.codigo, COUNT(p.id) 
            FROM profesionales p 
            JOIN especialidades e ON p.especialidad_id = e.id 
            WHERE p.activo = TRUE 
            GROUP BY e.codigo
        """)
        counts = cur.fetchall()
        for c in counts:
            f.write(f"Cod: '{c[0]}' -> {c[1]} profesionales\n")

finally:
    conn.close()
