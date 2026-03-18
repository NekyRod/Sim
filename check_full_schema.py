
import psycopg2
import sys
import io

# Force stdout to use utf-8 and replaces errors
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def check_schema():
    conn_str = "host=localhost port=5432 dbname=goi user=postgres password=postgres"
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        tables = ['profesionales', 'odontograma_historial', 'detalle_diente', 'procedimientos_personalizados', 'anamnesis']
        for table in tables:
            print(f"\n--- TABLE: {table} ---")
            cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}' AND table_schema = 'public' ORDER BY ordinal_position")
            for row in cur.fetchall():
                print(f"COL: {row[0]} ({row[1]})")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DB_ERROR: {str(e)}")

if __name__ == "__main__":
    check_schema()
