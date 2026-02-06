-- Full Schema Script for SIM Agenda (Pre-production Environment)
-- Consolidated from existing migration and structure scripts

-- =============================================================================
-- 0. DATABASE AND USER CREATION
-- =============================================================================
-- NOTE: These commands must be executed by a superuser (e.g., 'postgres').
-- If you are using psql, you can run: psql -U postgres -f Full_Schema_SIM.sql

/*
-- UNCOMMENT THESE LINES IF RUNNING MANUALLY FOR THE FIRST TIME
CREATE DATABASE "SIM";
CREATE USER "admiSim" WITH PASSWORD 'RAqk3TqV1hSGlVooeJHd';
ALTER DATABASE "SIM" OWNER TO "admiSim";
\c "SIM"
*/

-- =============================================================================
-- 1. TABLES CREATION
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tipos_identificacion (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ciudades_residencia (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tipos_servicio (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.especialidades (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prenombres (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.pacientes (
    id SERIAL PRIMARY KEY,
    tipo_identificacion VARCHAR(10) NOT NULL,
    numero_identificacion VARCHAR(50) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    telefono_fijo VARCHAR(20),
    telefono_celular VARCHAR(20),
    segundo_telefono_celular VARCHAR(20),
    titular_segundo_celular VARCHAR(60),
    tipo_doc_acompanante VARCHAR(10),
    nombre_acompanante VARCHAR(100),
    parentesco_acompanante VARCHAR(60),
    direccion TEXT,
    correo_electronico VARCHAR(150),
    lugar_residencia VARCHAR(100),
    fecha_nacimiento DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tipo_identificacion, numero_identificacion)
);

CREATE TABLE IF NOT EXISTS public.profesionales (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    nombre VARCHAR(100),
    apellidos VARCHAR(100),
    prenombre_id INT REFERENCES public.prenombres(id),
    tipo_identificacion VARCHAR(10),
    numero_identificacion VARCHAR(50),
    nit VARCHAR(20),
    correo VARCHAR(150),
    celular VARCHAR(20),
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    direccion TEXT,
    especialidad VARCHAR(100), -- Legacy column
    especialidad_id INT REFERENCES public.especialidades(id),
    estado_cuenta VARCHAR(20) DEFAULT 'Habilitada',
    activo BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profesional_especialidades_secundarias (
    profesional_id INT REFERENCES public.profesionales(id) ON DELETE CASCADE,
    especialidad_id INT REFERENCES public.especialidades(id) ON DELETE CASCADE,
    PRIMARY KEY (profesional_id, especialidad_id)
);

CREATE TABLE IF NOT EXISTS public.disponibilidades (
    id SERIAL PRIMARY KEY,
    profesional_id INT REFERENCES public.profesionales(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    intervalo_minutos INT NOT NULL DEFAULT 30,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.citas (
    id SERIAL PRIMARY KEY,
    paciente_id INT REFERENCES public.pacientes(id),
    profesional_id INT REFERENCES public.profesionales(id),
    fecha_programacion DATE NOT NULL,
    fecha_solicitada DATE,
    hora TIME NOT NULL,
    hora_fin TIME,
    tipo_servicio VARCHAR(30) NOT NULL,
    tipo_pbs VARCHAR(20),
    motivo_cita VARCHAR(50),
    observacion VARCHAR(255),
    estado VARCHAR(30) NOT NULL DEFAULT 'PROGRAMADA',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.festivos (
    id SERIAL PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL,
    descripcion VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rangos_bloqueados (
    id SERIAL PRIMARY KEY,
    profesional_id INT NOT NULL REFERENCES public.profesionales(id), 
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- 2. INITIAL DATA
-- =============================================================================

INSERT INTO public.tipos_identificacion (codigo, nombre) VALUES
    ('CC', 'Cédula de ciudadanía'),
    ('TI', 'Tarjeta de identidad'),
    ('CE', 'Cédula de extranjería'),
    ('PA', 'Pasaporte'),
    ('RC', 'Registro civil'),
    ('MS', 'Menor sin identificación')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.ciudades_residencia (nombre) VALUES
    ('Bogotá'), ('Medellín'), ('Cali'), ('Manizales'), ('Pereira'),
    ('Cartagena'), ('Santa Marta'), ('Boyacá')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.prenombres (nombre) VALUES
    ('Dr.'), ('Dra.'), ('Psic.'), ('Enf.')
ON CONFLICT (nombre) DO NOTHING;

-- =============================================================================
-- 3. PERMISSIONS
-- =============================================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "admiSim";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "admiSim";

-- =============================================================================
-- 4. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_pacientes_doc ON public.pacientes(numero_identificacion);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON public.citas(fecha_programacion);
CREATE INDEX IF NOT EXISTS idx_dispo_fecha ON public.disponibilidades(fecha);
