
import psycopg2
import sys

def check():
    conn_str = "host=localhost port=5432 dbname=goi user=postgres password=postgres"
    try:
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        
        for table in ['odontograma_historial', 'detalle_diente', 'profesionales', 'procedimientos_personalizados']:
            try:
                cur.execute(f"SELECT * FROM {table} LIMIT 0")
                colnames = [desc[0] for desc in cur.description]
                print(f"TABLE: {table} - COLS: {colnames}")
            except Exception as te:
                print(f"TABLE: {table} - ERROR: {repr(te)}")
                conn.rollback()
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"CONNECTION ERROR: {repr(e)}")

if __name__ == "__main__":
    check()
