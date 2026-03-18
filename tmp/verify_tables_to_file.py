import os
import sys

# Add the project directory to the python path
sys.path.append('d:\\OneDrive\\Desarr\\Proyectos\\GOI\\back')

from app.database.connection import get_db_connection

def verify_specific_tables():
    conn = get_db_connection()
    tables_to_check = ['odontograma_historial', 'detalle_diente', 'anamnesis', 'procedimientos_personalizados']
    output = []
    try:
        with conn, conn.cursor() as cur:
            for table in tables_to_check:
                cur.execute(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = '{table}'
                    );
                """)
                exists = cur.fetchone()[0]
                output.append(f"Table '{table}' exists: {exists}")
                
                if exists:
                    cur.execute(f"""
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = '{table}'
                        ORDER BY ordinal_position
                    """)
                    columns = cur.fetchall()
                    output.append(f"Columns for '{table}':")
                    for col in columns:
                        output.append(f"  - {col[0]} ({col[1]})")
                output.append("-" * 20)
    except Exception as e:
        output.append(f"Error: {e}")
    finally:
        conn.close()
    
    with open('d:\\OneDrive\\Desarr\\Proyectos\\GOI\\tmp\\verification_results.txt', 'w', encoding='utf-8') as f:
        f.write("\n".join(output))

if __name__ == "__main__":
    verify_specific_tables()
