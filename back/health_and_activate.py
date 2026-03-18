import urllib.request
import psycopg2

def check(port):
    try:
        url = f"http://localhost:{port}/health"
        with urllib.request.urlopen(url, timeout=1) as r:
            print(f"{port}: {r.read().decode()}")
    except Exception as e:
        print(f"{port}: Error {e}")

def activate():
    try:
        conn = psycopg2.connect(host="localhost", dbname="sim", user="admiSim", password="RAqk3TqV1hSGlVooeJHd", port=5432)
        cur = conn.cursor()
        cur.execute("UPDATE especialidades SET es_autogestion = TRUE WHERE nombre ILIKE '%Odontolog%a%';")
        conn.commit()
        print(f"Activated autogestion for {cur.rowcount} rows.")
        conn.close()
    except Exception as e:
        print(f"Activation Error: {e}")

if __name__ == "__main__":
    check(8001)
    check(8002)
    activate()
