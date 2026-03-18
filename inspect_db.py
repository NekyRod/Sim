
import psycopg2
import sys

def check_schema():
    conn_str = "host=localhost port=5432 dbname=goi user=postgres password=postgres"
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        tables = ['odontograma_historial', 'detalle_diente', 'anamnesis']
        for table in tables:
            sys.stdout.buffer.write(f"\n--- Schema for {table} ---\n".encode('utf-8'))
            cur.execute(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE (table_name = '{table}' AND table_schema = 'public')
                ORDER BY ordinal_position;
            """)
            rows = cur.fetchall()
            for row in rows:
                sys.stdout.buffer.write((str(row) + "\n").encode('utf-8', errors='replace'))
        
        cur.close()
        conn.close()
    except Exception as e:
        sys.stdout.buffer.write(f"Error: {str(e)}\n".encode('utf-8'))

if __name__ == "__main__":
    check_schema()
