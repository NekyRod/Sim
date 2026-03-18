-- =============================================================================
-- GOI SIM-ODONT — Full Database Schema + Seed Data
-- Generated for production deployment
-- Compatible with PostgreSQL 15+
-- =============================================================================
-- IMPORTANT: This script must be run AFTER creating the database and user.
-- See CREATE_USER.sql and INSTRUCCIONES_DB.md for details.
-- =============================================================================

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- =============================================================================
-- 1. TABLE DEFINITIONS (ordered by dependency)
-- =============================================================================

-- ── Tablas independientes (sin FK) ──────────────────────────────────────────

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

CREATE TABLE IF NOT EXISTS public.tipos_pbs (
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
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prenombres (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.festivos (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    descripcion VARCHAR(200),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.actions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.permission_groups (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

-- ── Tablas con dependencias niveau 1 ────────────────────────────────────────

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
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(tipo_identificacion, numero_identificacion)
);

CREATE TABLE IF NOT EXISTS public.profesionales (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    nombre VARCHAR(100),
    apellidos VARCHAR(100),
    prenombre_id INTEGER REFERENCES public.prenombres(id),
    tipo_identificacion VARCHAR(10),
    numero_identificacion VARCHAR(50),
    nit VARCHAR(20),
    correo VARCHAR(150),
    celular VARCHAR(20),
    telefono VARCHAR(20),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    direccion TEXT,
    especialidad VARCHAR(100),
    especialidad_id INTEGER REFERENCES public.especialidades(id),
    estado_cuenta VARCHAR(20) DEFAULT 'Habilitada',
    activo BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    role_id INTEGER REFERENCES public.roles(id)
);

CREATE TABLE IF NOT EXISTS public.smtp_settings (
    id SERIAL PRIMARY KEY,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    username VARCHAR(255),
    password_encrypted TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    use_tls BOOLEAN DEFAULT TRUE,
    use_ssl BOOLEAN DEFAULT FALSE,
    timeout_seconds INTEGER DEFAULT 30,
    enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

-- ── Tablas con dependencias nivel 2 ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profesional_especialidades_secundarias (
    profesional_id INTEGER REFERENCES public.profesionales(id) ON DELETE CASCADE,
    especialidad_id INTEGER REFERENCES public.especialidades(id) ON DELETE CASCADE,
    PRIMARY KEY (profesional_id, especialidad_id)
);

CREATE TABLE IF NOT EXISTS public.disponibilidades (
    id SERIAL PRIMARY KEY,
    profesional_id INTEGER REFERENCES public.profesionales(id),
    dia_semana INTEGER NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.citas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES public.pacientes(id),
    profesional_id INTEGER REFERENCES public.profesionales(id),
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
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    mas_6_meses BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.rangos_bloqueados (
    id SERIAL PRIMARY KEY,
    profesional_id INTEGER NOT NULL REFERENCES public.profesionales(id),
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.anamnesis (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE UNIQUE,
    antece_medicos JSONB DEFAULT '{}',
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES public.pacientes(id),
    status TEXT NOT NULL DEFAULT 'open',
    current_flow TEXT,
    current_step TEXT,
    context JSONB DEFAULT '{}',
    assigned_user_id INTEGER,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES public.chat_sessions(id),
    sender_type TEXT NOT NULL,
    sender_user_id INTEGER,
    content TEXT,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    type TEXT NOT NULL,
    session_id INTEGER REFERENCES public.chat_sessions(id),
    payload JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_group_id INTEGER NOT NULL REFERENCES public.permission_groups(id) ON DELETE CASCADE,
    action_id INTEGER NOT NULL REFERENCES public.actions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_group_id, action_id)
);

-- =============================================================================
-- 2. INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_pacientes_doc ON public.pacientes(numero_identificacion);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON public.citas(fecha_programacion);
CREATE INDEX IF NOT EXISTS idx_dispo_profesional ON public.disponibilidades(profesional_id);
CREATE INDEX IF NOT EXISTS idx_anamnesis_paciente_id ON public.anamnesis(paciente_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_patient_id ON public.chat_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_is_read ON public.chat_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_usuarios_role_id ON public.usuarios(role_id);

-- =============================================================================
-- 3. SEED DATA (Catálogos y configuración inicial)
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
    ('Bogotá'), ('Medellín'), ('Cali'), ('Manizales'),
    ('Pereira'), ('Cartagena'), ('Santa Marta'), ('Boyacá')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.prenombres (nombre) VALUES
    ('Dr.'), ('Dra.'), ('Psic.'), ('Enf.')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO public.tipos_servicio (codigo, nombre) VALUES
    ('PBS', 'Plan de Beneficios de Salud')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.especialidades (codigo, nombre) VALUES
    ('ODO', 'Odontología'),
    ('RES', 'Resina')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.tipos_pbs (codigo, nombre) VALUES
    ('CONT', 'Contributivo'),
    ('SUB', 'Subsidiado'),
    ('PART', 'Particular')
ON CONFLICT (codigo) DO NOTHING;

-- ── RBAC: Roles, Actions, Permission Groups ─────────────────────────────────

INSERT INTO public.roles (name, description, is_system, active) VALUES
    ('Administrador', 'Acceso total al sistema', TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.actions (code, name) VALUES
    ('view', 'Ver'),
    ('create', 'Crear'),
    ('edit', 'Editar'),
    ('delete', 'Eliminar')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.permission_groups (code, name, description, active) VALUES
    ('AGENDAMIENTO', 'Agendamiento', 'Gestión de citas y agendamiento', TRUE),
    ('PACIENTES', 'Pacientes', 'Gestión de pacientes', TRUE),
    ('PROFESIONALES', 'Profesionales', 'Gestión de profesionales', TRUE),
    ('HISTORIA_CLINICA', 'Historia Clínica', 'Acceso a historias clínicas', TRUE),
    ('CONFIGURACION', 'Configuración', 'Configuración general del sistema', TRUE),
    ('CHAT', 'Chat', 'Gestión de chats con pacientes', TRUE),
    ('ADMIN', 'Administración', 'Administración general', TRUE),
    ('AGENDAS', 'Agendas', 'Gestión de agendas médicas', TRUE),
    ('DISPONIBILIDAD', 'Disponibilidad', 'Configuración de disponibilidad', TRUE),
    ('INFORMES', 'Informes', 'Acceso a reportes y estadísticas', TRUE),
    ('TIPOS_SERVICIO', 'Tipos de Servicio', 'Gestión de tipos de servicios médicos', TRUE),
    ('ESPECIALIDADES', 'Especialidades', 'Gestión de especialidades médicas', TRUE),
    ('PBS', 'Tipos PBS', 'Gestión de tipos de beneficios (PBS)', TRUE),
    ('FESTIVOS', 'Festivos', 'Calendario de días no laborales', TRUE),
    ('IDENTIFICACION', 'Tipos de Identificación', 'Parámetros de documentos legales', TRUE),
    ('CIUDADES', 'Ciudades', 'Maestro de ciudades y departamentos', TRUE),
    ('SISTEMA', 'Sistema', 'Configuraciones técnicas (SMTP, etc.)', TRUE),
    ('USUARIOS', 'Usuarios', 'Gestión de usuarios y accesos', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =============================================================================
-- 4. DEFAULT ADMIN USER
-- =============================================================================
-- Usuarios iniciales (mismas credenciales que en desarrollo)
-- Para cambiar la contraseña, generar un nuevo hash con:
--   python -c "from passlib.hash import bcrypt; print(bcrypt.hash('NUEVA_CLAVE'))"

INSERT INTO public.usuarios (username, password_hash, rol, activo, role_id)
SELECT 'admin', '$2b$12$MCO25d3w4w6Io95hReL.AO0SrgB.z55TAwA8tprTaNfdAje4PqHEq', 'ADMIN', TRUE, r.id
FROM roles r WHERE r.name = 'Administrador'
ON CONFLICT (username) DO NOTHING;

-- =============================================================================
-- 5. ADMIN ROLE PERMISSIONS (all permissions for Administrador)
-- =============================================================================

INSERT INTO public.role_permissions (role_id, permission_group_id, action_id)
SELECT r.id, pg.id, a.id
FROM roles r
CROSS JOIN permission_groups pg
CROSS JOIN actions a
WHERE r.name = 'Administrador'
ON CONFLICT (role_id, permission_group_id, action_id) DO NOTHING;

-- =============================================================================
-- 6. GRANTS
-- =============================================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "admiSim";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "admiSim";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "admiSim";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "admiSim";
