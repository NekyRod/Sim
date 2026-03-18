
import psycopg2
import sys

def check_constraint():
    conn_str = "host=localhost port=5432 dbname=goi user=postgres password=postgres"
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        table = 'anamnesis'
        sys.stdout.buffer.write(f"\n--- Constraints for {table} ---\n".encode('utf-8'))
        cur.execute(f"""
            SELECT conname, contype, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public' AND contype IN ('u', 'p')
            AND conrelid = '{table}'::regclass;
        """)
        rows = cur.fetchall()
        for row in rows:
            sys.stdout.buffer.write((str(row) + "\n").encode('utf-8', errors='replace'))
        
        cur.close()
        conn.close()
    except Exception as e:
        sys.stdout.buffer.write(f"Error: {str(e)}\n".encode('utf-8'))

if __name__ == "__main__":
    check_constraint()
