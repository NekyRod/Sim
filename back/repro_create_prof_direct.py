import sys
import os
import random
import traceback
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.control import profesionales_control
import psycopg2

rand_id = str(random.randint(10000000, 99999999))
data = {
    "nombre": f"TestRepo_{rand_id}",
    "apellidos": "UserRepo",
    "tipo_identificacion": "CC",
    "numero_identificacion": rand_id,
    "nombre_completo": f"Test Repo User {rand_id}",
    "especialidad_id": 5, 
    "activo": True,
    "estado_cuenta": "Habilitada",
    "especialidades_secundarias": []
}

try:
    print(f"Attempting to create generic professional {rand_id}...")
    res = profesionales_control.crear_profesional(data)
    print("Success:", res)
except psycopg2.Error as e:
    print("PG Code:", e.pgcode)
    print("PG Error:", e.pgerror)
    print("Diag:", e.diag.message_primary if e.diag else "No diag")
    print("Detail:", e.diag.message_detail if e.diag else "No detail")
except Exception as e:
    print("General Error:", e)
    traceback.print_exc()
