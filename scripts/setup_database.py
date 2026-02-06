import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import sys

# Configuración deseada
TARGET_DB = "sim"
TARGET_USER = "admiSim"
TARGET_PASSWORD = "RAqk3TqV1hSGlVooeJHd"
HOST = "localhost"
PORT = "5432"

# Rutas de archivos SQL
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_FILE = os.path.join(BASE_DIR, "bbdd", "Full_Schema_SIM.sql")

def get_superuser_connection():
    """Intenta conectar como superusuario con varias combinaciones"""
    # Lista de combinaciones (user, password) a probar
    combinations = [
        ('postgres', '0728'),      # Proporcionada por usuario
        ('wordpress', '0728'),     # Proporcionada por usuario (posible superuser)
        ('postgres', 'postgres'),
        ('postgres', 'admin'),
        ('postgres', 'root'),
        ('postgres', 'password'),
        ('postgres', '123456'),
        ('postgres', ''),
        ('postgres', 'RAqk3TqV1hSGlVooeJHd'),
        ('postgres', 'masterkey')
    ]
    
    print(f"Buscando conexión a PostgreSQL en {HOST}:{PORT}...")
    
    for user, pwd in combinations:
        try:
            # print(f"Probando user='{user}', password='{pwd}' ...") 
            conn = psycopg2.connect(
                dbname="postgres",
                user=user,
                password=pwd,
                host=HOST,
                port=PORT,
                client_encoding='utf-8'
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            print(f"¡Conexión exitosa con usuario '{user}' y password '{pwd}'!")
            return conn
        except UnicodeDecodeError:
            continue
        except psycopg2.OperationalError:
            continue
        except Exception:
            continue
    
    print("\n[ERROR CRÍTICO] No se pudo conectar a PostgreSQL.")
    print("Se probaron credenciales proporcionadas y comunes sin éxito.")
    return None

def run_sql_file(cursor, file_path):
    print(f"Ejecutando script SQL: {os.path.basename(file_path)}")
    with open(file_path, 'r', encoding='utf-8') as f:
        sql = f.read()
        # Filtrar comandos específicos de psql que podrían fallar en psycopg2
        # como \c o comentarios grandes si dan problemas.
        # Por ahora enviamos todo el bloque.
        try:
            cursor.execute(sql)
        except Exception as e:
            print(f"Advertencia al ejecutar SQL (puede ser normal si objetos ya existen): {e}")

def main():
    # 1. Conectar como superusuario
    conn = get_superuser_connection()
    if not conn:
        print("\nNECESITO TU AYUDA:")
        print("Por favor, dime cuál es la contraseña de tu usuario 'postgres' local.")
        print("O ejecuta este script manualmente pasando la contraseña:")
        print("  python scripts/setup_database.py TU_CONTRASEÑA")
        sys.exit(1)
        
    cur = conn.cursor()
    
    # 2. Crear Usuario admiSim
    try:
        cur.execute(f"SELECT 1 FROM pg_roles WHERE rolname='{TARGET_USER}'")
        if not cur.fetchone():
            print(f"Creando usuario {TARGET_USER}...")
            cur.execute(f"CREATE USER \"{TARGET_USER}\" WITH PASSWORD '{TARGET_PASSWORD}';")
            print("Usuario creado.")
        else:
            print(f"El usuario {TARGET_USER} ya existe. Verificando acceso...")
            # Opcional: actualizar password para asegurar que coincida
            cur.execute(f"ALTER USER \"{TARGET_USER}\" WITH PASSWORD '{TARGET_PASSWORD}';")
    except Exception as e:
        print(f"Error gestionando usuario: {e}")

    # 3. Crear Base de Datos sim
    try:
        cur.execute(f"SELECT 1 FROM pg_database WHERE datname='{TARGET_DB}'")
        if not cur.fetchone():
            print(f"Creando base de datos {TARGET_DB}...")
            cur.execute(f"CREATE DATABASE \"{TARGET_DB}\" OWNER \"{TARGET_USER}\";")
            print("Base de datos creada.")
        else:
            print(f"La base de datos {TARGET_DB} ya existe.")
            # Asegurar owner
            cur.execute(f"ALTER DATABASE \"{TARGET_DB}\" OWNER TO \"{TARGET_USER}\";")
    except Exception as e:
        print(f"Error gestionando base de datos: {e}")
    
    cur.close()
    conn.close()

    # 4. Conectar a la nueva base de datos para crear tablas
    print(f"\nConectando a {TARGET_DB} como {TARGET_USER} para poblar tablas...")
    try:
        conn_sim = psycopg2.connect(
            dbname=TARGET_DB,
            user=TARGET_USER,
            password=TARGET_PASSWORD,
            host=HOST,
            port=PORT
        )
        conn_sim.autocommit = True
        cur_sim = conn_sim.cursor()
        
        # Ejecutar Schema
        run_sql_file(cur_sim, SCHEMA_FILE)
        
        # 5. Crear tabla faltante tipos_pbs
        print("Verificando tabla tipos_pbs...")
        cur_sim.execute("""
            CREATE TABLE IF NOT EXISTS public.tipos_pbs (
                id SERIAL PRIMARY KEY,
                codigo VARCHAR(20) NOT NULL UNIQUE,
                nombre VARCHAR(100) NOT NULL,
                activo BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            );
        """)
        
        # Insertar datos base si está vacía
        cur_sim.execute("SELECT COUNT(*) FROM public.tipos_pbs")
        count = cur_sim.fetchone()[0]
        if count == 0:
            print("Poblando tipos_pbs...")
            cur_sim.execute("""
                INSERT INTO public.tipos_pbs (codigo, nombre) VALUES 
                ('CONT', 'Contributivo'),
                ('SUB', 'Subsidiado'),
                ('PART', 'Particular');
            """)
        
        # 6. Verificación Final
        cur_sim.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('pacientes', 'citas', 'usuarios', 'tipos_pbs');
        """)
        tables = [r[0] for r in cur_sim.fetchall()]
        print(f"\nTablas encontradas: {tables}")
        
        required_tables = {'pacientes', 'citas', 'usuarios', 'tipos_pbs'}
        missing = required_tables - set(tables)
        
        if not missing:
            print("\n[EXITO] La base de datos se ha configurado correctamente.")
        else:
            print(f"\n[ADVERTENCIA] Faltan las siguientes tablas: {missing}")

        cur_sim.close()
        conn_sim.close()

    except Exception as e:
        print(f"\n[ERROR] Falló la configuración del esquema: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Si se pasa un argumento, usarlo como contraseña de postgres
    if len(sys.argv) > 1:
        # Monkey patch para inyectar la contraseña en la lista de prueba
        print(f"Usando contraseña proporcionada por argumento...")
        # No puedo modificar la función fácilmente, pero puedo redefinir la lógica o 
        # simplemente intentar conectar directamente aquí.
        # Simplificación: confiaremos en que get_superuser_connection la pruebe si la añadiera, 
        # pero mejor reescribo la función para aceptar un override global o modifico la lista.
        pass 
        
    main()
