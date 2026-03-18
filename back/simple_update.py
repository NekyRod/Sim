import psycopg2
conn = psycopg2.connect(host="localhost", dbname="sim", user="admiSim", password="RAqk3TqV1hSGlVooeJHd", port=5432)
cur = conn.cursor()
cur.execute("UPDATE especialidades SET es_autogestion = TRUE WHERE id = 6;")
conn.commit()
cur.execute("SELECT id, nombre, es_autogestion FROM especialidades WHERE id = 6;")
print(cur.fetchone())
conn.close()
