import psycopg2
import sys
try:
    conn = psycopg2.connect(host="localhost", dbname="sim", user="admiSim", password="RAqk3TqV1hSGlVooeJHd", port=5432)
    cur = conn.cursor()
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'chat_notifications';")
    cols = cur.fetchall()
    print("COLUMNS:")
    for c in cols:
        print(f"- {c[0]} ({c[1]})")
    conn.close()
except Exception as e:
    print(f"Error: {repr(e)}")
