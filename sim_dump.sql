--
-- PostgreSQL database dump
--

\restrict TcaSJlJlWNXjDT3cKgAW7b5QOwgYfRqS6SVAZeG6kOj64IYtUP23dCMVVBgKuTq

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actions; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.actions (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.actions OWNER TO "admiSim";

--
-- Name: actions_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.actions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.actions_id_seq OWNER TO "admiSim";

--
-- Name: actions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.actions_id_seq OWNED BY public.actions.id;


--
-- Name: alertas_paciente; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.alertas_paciente (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    texto text NOT NULL,
    activa boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    created_by integer
);


ALTER TABLE public.alertas_paciente OWNER TO "admiSim";

--
-- Name: alertas_paciente_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.alertas_paciente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.alertas_paciente_id_seq OWNER TO "admiSim";

--
-- Name: alertas_paciente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.alertas_paciente_id_seq OWNED BY public.alertas_paciente.id;


--
-- Name: anamnesis; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.anamnesis (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    antece_medicos jsonb DEFAULT '{}'::jsonb,
    observaciones text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.anamnesis OWNER TO "admiSim";

--
-- Name: anamnesis_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.anamnesis_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.anamnesis_id_seq OWNER TO "admiSim";

--
-- Name: anamnesis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.anamnesis_id_seq OWNED BY public.anamnesis.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    session_id integer NOT NULL,
    sender_type text NOT NULL,
    sender_user_id integer,
    content text,
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_messages OWNER TO "admiSim";

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_messages_id_seq OWNER TO "admiSim";

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_notifications; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.chat_notifications (
    id integer NOT NULL,
    user_id integer,
    type text NOT NULL,
    session_id integer,
    payload jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_notifications OWNER TO "admiSim";

--
-- Name: chat_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.chat_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_notifications_id_seq OWNER TO "admiSim";

--
-- Name: chat_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.chat_notifications_id_seq OWNED BY public.chat_notifications.id;


--
-- Name: chat_sessions; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.chat_sessions (
    id integer NOT NULL,
    patient_id integer,
    status text DEFAULT 'open'::text NOT NULL,
    current_flow text,
    current_step text,
    context jsonb DEFAULT '{}'::jsonb,
    assigned_user_id integer,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.chat_sessions OWNER TO "admiSim";

--
-- Name: chat_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.chat_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chat_sessions_id_seq OWNER TO "admiSim";

--
-- Name: chat_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.chat_sessions_id_seq OWNED BY public.chat_sessions.id;


--
-- Name: citas; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.citas (
    id integer NOT NULL,
    paciente_id integer,
    profesional_id integer,
    fecha_programacion date NOT NULL,
    fecha_solicitada date,
    hora time without time zone NOT NULL,
    hora_fin time without time zone,
    tipo_servicio character varying(30) NOT NULL,
    tipo_pbs character varying(20),
    motivo_cita character varying(50),
    observacion character varying(255),
    estado character varying(30) DEFAULT 'PROGRAMADA'::character varying NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    mas_6_meses boolean DEFAULT false,
    cancelado_por_nombre character varying(150),
    cancelado_por_documento character varying(50),
    cancelado_motivo text,
    fecha_cancelacion timestamp without time zone
);


ALTER TABLE public.citas OWNER TO "admiSim";

--
-- Name: citas_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.citas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.citas_id_seq OWNER TO "admiSim";

--
-- Name: citas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.citas_id_seq OWNED BY public.citas.id;


--
-- Name: ciudades_residencia; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.ciudades_residencia (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ciudades_residencia OWNER TO "admiSim";

--
-- Name: ciudades_residencia_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.ciudades_residencia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.ciudades_residencia_id_seq OWNER TO "admiSim";

--
-- Name: ciudades_residencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.ciudades_residencia_id_seq OWNED BY public.ciudades_residencia.id;


--
-- Name: disponibilidades; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.disponibilidades (
    id integer NOT NULL,
    profesional_id integer,
    dia_semana integer NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.disponibilidades OWNER TO "admiSim";

--
-- Name: disponibilidades_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.disponibilidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.disponibilidades_id_seq OWNER TO "admiSim";

--
-- Name: disponibilidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.disponibilidades_id_seq OWNED BY public.disponibilidades.id;


--
-- Name: especialidades; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.especialidades (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(200) NOT NULL,
    activo boolean DEFAULT true,
    es_autogestion boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.especialidades OWNER TO "admiSim";

--
-- Name: especialidades_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.especialidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.especialidades_id_seq OWNER TO "admiSim";

--
-- Name: especialidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.especialidades_id_seq OWNED BY public.especialidades.id;


--
-- Name: festivos; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.festivos (
    id integer NOT NULL,
    fecha date NOT NULL,
    descripcion character varying(200),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.festivos OWNER TO "admiSim";

--
-- Name: festivos_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.festivos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.festivos_id_seq OWNER TO "admiSim";

--
-- Name: festivos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.festivos_id_seq OWNED BY public.festivos.id;


--
-- Name: pacientes; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.pacientes (
    id integer NOT NULL,
    tipo_identificacion character varying(10) NOT NULL,
    numero_identificacion character varying(50) NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    telefono_fijo character varying(20),
    telefono_celular character varying(20),
    segundo_telefono_celular character varying(20),
    titular_segundo_celular character varying(60),
    tipo_doc_acompanante character varying(10),
    nombre_acompanante character varying(100),
    parentesco_acompanante character varying(60),
    direccion text,
    correo_electronico character varying(150),
    lugar_residencia character varying(100),
    fecha_nacimiento date,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.pacientes OWNER TO "admiSim";

--
-- Name: pacientes_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.pacientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.pacientes_id_seq OWNER TO "admiSim";

--
-- Name: pacientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.pacientes_id_seq OWNED BY public.pacientes.id;


--
-- Name: permission_groups; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.permission_groups (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.permission_groups OWNER TO "admiSim";

--
-- Name: permission_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.permission_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.permission_groups_id_seq OWNER TO "admiSim";

--
-- Name: permission_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.permission_groups_id_seq OWNED BY public.permission_groups.id;


--
-- Name: prenombres; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.prenombres (
    id integer NOT NULL,
    nombre character varying(20) NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.prenombres OWNER TO "admiSim";

--
-- Name: prenombres_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.prenombres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.prenombres_id_seq OWNER TO "admiSim";

--
-- Name: prenombres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.prenombres_id_seq OWNED BY public.prenombres.id;


--
-- Name: profesional_especialidades_secundarias; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.profesional_especialidades_secundarias (
    profesional_id integer NOT NULL,
    especialidad_id integer NOT NULL
);


ALTER TABLE public.profesional_especialidades_secundarias OWNER TO "admiSim";

--
-- Name: profesionales; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.profesionales (
    id integer NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    nombre character varying(100),
    apellidos character varying(100),
    prenombre_id integer,
    tipo_identificacion character varying(10),
    numero_identificacion character varying(50),
    nit character varying(20),
    correo character varying(150),
    celular character varying(20),
    telefono character varying(20),
    ciudad character varying(100),
    departamento character varying(100),
    direccion text,
    especialidad character varying(100),
    especialidad_id integer,
    estado_cuenta character varying(20) DEFAULT 'Habilitada'::character varying,
    activo boolean DEFAULT true,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.profesionales OWNER TO "admiSim";

--
-- Name: profesionales_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.profesionales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.profesionales_id_seq OWNER TO "admiSim";

--
-- Name: profesionales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.profesionales_id_seq OWNED BY public.profesionales.id;


--
-- Name: rangos_bloqueados; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.rangos_bloqueados (
    id integer NOT NULL,
    profesional_id integer NOT NULL,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    descripcion text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.rangos_bloqueados OWNER TO "admiSim";

--
-- Name: rangos_bloqueados_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.rangos_bloqueados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.rangos_bloqueados_id_seq OWNER TO "admiSim";

--
-- Name: rangos_bloqueados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.rangos_bloqueados_id_seq OWNED BY public.rangos_bloqueados.id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.role_permissions (
    id integer NOT NULL,
    role_id integer NOT NULL,
    permission_group_id integer NOT NULL,
    action_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.role_permissions OWNER TO "admiSim";

--
-- Name: role_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.role_permissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.role_permissions_id_seq OWNER TO "admiSim";

--
-- Name: role_permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.role_permissions_id_seq OWNED BY public.role_permissions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_system boolean DEFAULT false,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO "admiSim";

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.roles_id_seq OWNER TO "admiSim";

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: smtp_settings; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.smtp_settings (
    id integer NOT NULL,
    host character varying(255) NOT NULL,
    port integer NOT NULL,
    username character varying(255),
    password_encrypted text,
    from_email character varying(255),
    from_name character varying(255),
    use_tls boolean DEFAULT true,
    use_ssl boolean DEFAULT false,
    timeout_seconds integer DEFAULT 30,
    enabled boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(255)
);


ALTER TABLE public.smtp_settings OWNER TO "admiSim";

--
-- Name: smtp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.smtp_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.smtp_settings_id_seq OWNER TO "admiSim";

--
-- Name: smtp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.smtp_settings_id_seq OWNED BY public.smtp_settings.id;


--
-- Name: tipos_identificacion; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.tipos_identificacion (
    id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tipos_identificacion OWNER TO "admiSim";

--
-- Name: tipos_identificacion_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.tipos_identificacion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tipos_identificacion_id_seq OWNER TO "admiSim";

--
-- Name: tipos_identificacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.tipos_identificacion_id_seq OWNED BY public.tipos_identificacion.id;


--
-- Name: tipos_pbs; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.tipos_pbs (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tipos_pbs OWNER TO "admiSim";

--
-- Name: tipos_pbs_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.tipos_pbs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tipos_pbs_id_seq OWNER TO "admiSim";

--
-- Name: tipos_pbs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.tipos_pbs_id_seq OWNED BY public.tipos_pbs.id;


--
-- Name: tipos_servicio; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.tipos_servicio (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tipos_servicio OWNER TO "admiSim";

--
-- Name: tipos_servicio_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.tipos_servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tipos_servicio_id_seq OWNER TO "admiSim";

--
-- Name: tipos_servicio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.tipos_servicio_id_seq OWNED BY public.tipos_servicio.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: admiSim
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username character varying(100) NOT NULL,
    password_hash character varying(200) NOT NULL,
    rol character varying(50) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    creado_en timestamp without time zone DEFAULT now() NOT NULL,
    role_id integer
);


ALTER TABLE public.usuarios OWNER TO "admiSim";

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: admiSim
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.usuarios_id_seq OWNER TO "admiSim";

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: admiSim
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: actions id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.actions ALTER COLUMN id SET DEFAULT nextval('public.actions_id_seq'::regclass);


--
-- Name: alertas_paciente id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.alertas_paciente ALTER COLUMN id SET DEFAULT nextval('public.alertas_paciente_id_seq'::regclass);


--
-- Name: anamnesis id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.anamnesis ALTER COLUMN id SET DEFAULT nextval('public.anamnesis_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chat_notifications id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.chat_notifications ALTER COLUMN id SET DEFAULT nextval('public.chat_notifications_id_seq'::regclass);


--
-- Name: chat_sessions id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.chat_sessions ALTER COLUMN id SET DEFAULT nextval('public.chat_sessions_id_seq'::regclass);


--
-- Name: citas id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.citas ALTER COLUMN id SET DEFAULT nextval('public.citas_id_seq'::regclass);


--
-- Name: ciudades_residencia id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.ciudades_residencia ALTER COLUMN id SET DEFAULT nextval('public.ciudades_residencia_id_seq'::regclass);


--
-- Name: disponibilidades id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.disponibilidades ALTER COLUMN id SET DEFAULT nextval('public.disponibilidades_id_seq'::regclass);


--
-- Name: especialidades id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.especialidades ALTER COLUMN id SET DEFAULT nextval('public.especialidades_id_seq'::regclass);


--
-- Name: festivos id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.festivos ALTER COLUMN id SET DEFAULT nextval('public.festivos_id_seq'::regclass);


--
-- Name: pacientes id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.pacientes ALTER COLUMN id SET DEFAULT nextval('public.pacientes_id_seq'::regclass);


--
-- Name: permission_groups id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.permission_groups ALTER COLUMN id SET DEFAULT nextval('public.permission_groups_id_seq'::regclass);


--
-- Name: prenombres id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.prenombres ALTER COLUMN id SET DEFAULT nextval('public.prenombres_id_seq'::regclass);


--
-- Name: profesionales id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.profesionales ALTER COLUMN id SET DEFAULT nextval('public.profesionales_id_seq'::regclass);


--
-- Name: rangos_bloqueados id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.rangos_bloqueados ALTER COLUMN id SET DEFAULT nextval('public.rangos_bloqueados_id_seq'::regclass);


--
-- Name: role_permissions id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN id SET DEFAULT nextval('public.role_permissions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: smtp_settings id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.smtp_settings ALTER COLUMN id SET DEFAULT nextval('public.smtp_settings_id_seq'::regclass);


--
-- Name: tipos_identificacion id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.tipos_identificacion ALTER COLUMN id SET DEFAULT nextval('public.tipos_identificacion_id_seq'::regclass);


--
-- Name: tipos_pbs id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.tipos_pbs ALTER COLUMN id SET DEFAULT nextval('public.tipos_pbs_id_seq'::regclass);


--
-- Name: tipos_servicio id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.tipos_servicio ALTER COLUMN id SET DEFAULT nextval('public.tipos_servicio_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: actions; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.actions (id, code, name) FROM stdin;
1	view	Ver
2	create	Crear
3	edit	Editar
4	delete	Eliminar
\.


--
-- Data for Name: alertas_paciente; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.alertas_paciente (id, paciente_id, tipo, texto, activa, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: anamnesis; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.anamnesis (id, paciente_id, antece_medicos, observaciones, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.chat_messages (id, session_id, sender_type, sender_user_id, content, meta, created_at) FROM stdin;
\.


--
-- Data for Name: chat_notifications; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.chat_notifications (id, user_id, type, session_id, payload, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: chat_sessions; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.chat_sessions (id, patient_id, status, current_flow, current_step, context, assigned_user_id, last_message_at, created_at) FROM stdin;
\.


--
-- Data for Name: citas; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.citas (id, paciente_id, profesional_id, fecha_programacion, fecha_solicitada, hora, hora_fin, tipo_servicio, tipo_pbs, motivo_cita, observacion, estado, activo, created_at, updated_at, mas_6_meses, cancelado_por_nombre, cancelado_por_documento, cancelado_motivo, fecha_cancelacion) FROM stdin;
\.


--
-- Data for Name: ciudades_residencia; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.ciudades_residencia (id, nombre, activo, created_at, updated_at) FROM stdin;
1	Bogotá	t	2026-03-18 06:47:59.78611	2026-03-18 06:47:59.78611
2	Medellín	t	2026-03-18 06:47:59.78611	2026-03-18 06:47:59.78611
3	Cali	t	2026-03-18 06:47:59.78611	2026-03-18 06:47:59.78611
4	Manizales	t	2026-03-18 06:47:59.78611	2026-03-18 06:47:59.78611
5	Pereira	t	2026-03-18 06:47:59.78611	2026-03-18 06:47:59.78611
6	Cartagena	t	2026-03-18 06:47:59.78611	2026-03-18 06:47:59.78611
7	Santa Marta	t	2026-03-18 06:47:59.78611	2026-03-18 06:47:59.78611
8	Boyacá	t	2026-03-18 06:47:59.78611	2026-03-18 06:47:59.78611
\.


--
-- Data for Name: disponibilidades; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.disponibilidades (id, profesional_id, dia_semana, hora_inicio, hora_fin, activo, created_at) FROM stdin;
\.


--
-- Data for Name: especialidades; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.especialidades (id, codigo, nombre, activo, es_autogestion, created_at, updated_at) FROM stdin;
1	ODO	Odontología	t	f	2026-03-18 06:47:59.794376	2026-03-18 06:47:59.794376
2	RES	Resina	t	f	2026-03-18 06:47:59.794376	2026-03-18 06:47:59.794376
\.


--
-- Data for Name: festivos; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.festivos (id, fecha, descripcion, created_at) FROM stdin;
\.


--
-- Data for Name: pacientes; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.pacientes (id, tipo_identificacion, numero_identificacion, nombre_completo, telefono_fijo, telefono_celular, segundo_telefono_celular, titular_segundo_celular, tipo_doc_acompanante, nombre_acompanante, parentesco_acompanante, direccion, correo_electronico, lugar_residencia, fecha_nacimiento, activo, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: permission_groups; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.permission_groups (id, code, name, description, active, created_at) FROM stdin;
1	AGENDAMIENTO	Agendamiento	Gestión de citas y agendamiento	t	2026-03-18 06:47:59.804498
2	PACIENTES	Pacientes	Gestión de pacientes	t	2026-03-18 06:47:59.804498
3	PROFESIONALES	Profesionales	Gestión de profesionales	t	2026-03-18 06:47:59.804498
4	HISTORIA_CLINICA	Historia Clínica	Acceso a historias clínicas	t	2026-03-18 06:47:59.804498
5	CONFIGURACION	Configuración	Configuración general del sistema	t	2026-03-18 06:47:59.804498
6	CHAT	Chat	Gestión de chats con pacientes	t	2026-03-18 06:47:59.804498
7	ADMIN	Administración	Administración general	t	2026-03-18 06:47:59.804498
8	AGENDAS	Agendas	Gestión de agendas médicas	t	2026-03-18 06:47:59.804498
9	DISPONIBILIDAD	Disponibilidad	Configuración de disponibilidad	t	2026-03-18 06:47:59.804498
10	INFORMES	Informes	Acceso a reportes y estadísticas	t	2026-03-18 06:47:59.804498
11	TIPOS_SERVICIO	Tipos de Servicio	Gestión de tipos de servicios médicos	t	2026-03-18 06:47:59.804498
12	ESPECIALIDADES	Especialidades	Gestión de especialidades médicas	t	2026-03-18 06:47:59.804498
13	PBS	Tipos PBS	Gestión de tipos de beneficios (PBS)	t	2026-03-18 06:47:59.804498
14	FESTIVOS	Festivos	Calendario de días no laborales	t	2026-03-18 06:47:59.804498
15	IDENTIFICACION	Tipos de Identificación	Parámetros de documentos legales	t	2026-03-18 06:47:59.804498
16	CIUDADES	Ciudades	Maestro de ciudades y departamentos	t	2026-03-18 06:47:59.804498
17	SISTEMA	Sistema	Configuraciones técnicas (SMTP, etc.)	t	2026-03-18 06:47:59.804498
18	USUARIOS	Usuarios	Gestión de usuarios y accesos	t	2026-03-18 06:47:59.804498
\.


--
-- Data for Name: prenombres; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.prenombres (id, nombre, activo) FROM stdin;
1	Dr.	t
2	Dra.	t
3	Psic.	t
4	Enf.	t
\.


--
-- Data for Name: profesional_especialidades_secundarias; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.profesional_especialidades_secundarias (profesional_id, especialidad_id) FROM stdin;
\.


--
-- Data for Name: profesionales; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.profesionales (id, nombre_completo, nombre, apellidos, prenombre_id, tipo_identificacion, numero_identificacion, nit, correo, celular, telefono, ciudad, departamento, direccion, especialidad, especialidad_id, estado_cuenta, activo, updated_at) FROM stdin;
\.


--
-- Data for Name: rangos_bloqueados; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.rangos_bloqueados (id, profesional_id, fecha, hora_inicio, hora_fin, descripcion, created_at) FROM stdin;
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.role_permissions (id, role_id, permission_group_id, action_id, created_at) FROM stdin;
1	1	1	1	2026-03-18 06:47:59.81247
2	1	2	1	2026-03-18 06:47:59.81247
3	1	3	1	2026-03-18 06:47:59.81247
4	1	4	1	2026-03-18 06:47:59.81247
5	1	5	1	2026-03-18 06:47:59.81247
6	1	6	1	2026-03-18 06:47:59.81247
7	1	7	1	2026-03-18 06:47:59.81247
8	1	8	1	2026-03-18 06:47:59.81247
9	1	9	1	2026-03-18 06:47:59.81247
10	1	10	1	2026-03-18 06:47:59.81247
11	1	11	1	2026-03-18 06:47:59.81247
12	1	12	1	2026-03-18 06:47:59.81247
13	1	13	1	2026-03-18 06:47:59.81247
14	1	14	1	2026-03-18 06:47:59.81247
15	1	15	1	2026-03-18 06:47:59.81247
16	1	16	1	2026-03-18 06:47:59.81247
17	1	17	1	2026-03-18 06:47:59.81247
18	1	18	1	2026-03-18 06:47:59.81247
19	1	1	2	2026-03-18 06:47:59.81247
20	1	2	2	2026-03-18 06:47:59.81247
21	1	3	2	2026-03-18 06:47:59.81247
22	1	4	2	2026-03-18 06:47:59.81247
23	1	5	2	2026-03-18 06:47:59.81247
24	1	6	2	2026-03-18 06:47:59.81247
25	1	7	2	2026-03-18 06:47:59.81247
26	1	8	2	2026-03-18 06:47:59.81247
27	1	9	2	2026-03-18 06:47:59.81247
28	1	10	2	2026-03-18 06:47:59.81247
29	1	11	2	2026-03-18 06:47:59.81247
30	1	12	2	2026-03-18 06:47:59.81247
31	1	13	2	2026-03-18 06:47:59.81247
32	1	14	2	2026-03-18 06:47:59.81247
33	1	15	2	2026-03-18 06:47:59.81247
34	1	16	2	2026-03-18 06:47:59.81247
35	1	17	2	2026-03-18 06:47:59.81247
36	1	18	2	2026-03-18 06:47:59.81247
37	1	1	3	2026-03-18 06:47:59.81247
38	1	2	3	2026-03-18 06:47:59.81247
39	1	3	3	2026-03-18 06:47:59.81247
40	1	4	3	2026-03-18 06:47:59.81247
41	1	5	3	2026-03-18 06:47:59.81247
42	1	6	3	2026-03-18 06:47:59.81247
43	1	7	3	2026-03-18 06:47:59.81247
44	1	8	3	2026-03-18 06:47:59.81247
45	1	9	3	2026-03-18 06:47:59.81247
46	1	10	3	2026-03-18 06:47:59.81247
47	1	11	3	2026-03-18 06:47:59.81247
48	1	12	3	2026-03-18 06:47:59.81247
49	1	13	3	2026-03-18 06:47:59.81247
50	1	14	3	2026-03-18 06:47:59.81247
51	1	15	3	2026-03-18 06:47:59.81247
52	1	16	3	2026-03-18 06:47:59.81247
53	1	17	3	2026-03-18 06:47:59.81247
54	1	18	3	2026-03-18 06:47:59.81247
55	1	1	4	2026-03-18 06:47:59.81247
56	1	2	4	2026-03-18 06:47:59.81247
57	1	3	4	2026-03-18 06:47:59.81247
58	1	4	4	2026-03-18 06:47:59.81247
59	1	5	4	2026-03-18 06:47:59.81247
60	1	6	4	2026-03-18 06:47:59.81247
61	1	7	4	2026-03-18 06:47:59.81247
62	1	8	4	2026-03-18 06:47:59.81247
63	1	9	4	2026-03-18 06:47:59.81247
64	1	10	4	2026-03-18 06:47:59.81247
65	1	11	4	2026-03-18 06:47:59.81247
66	1	12	4	2026-03-18 06:47:59.81247
67	1	13	4	2026-03-18 06:47:59.81247
68	1	14	4	2026-03-18 06:47:59.81247
69	1	15	4	2026-03-18 06:47:59.81247
70	1	16	4	2026-03-18 06:47:59.81247
71	1	17	4	2026-03-18 06:47:59.81247
72	1	18	4	2026-03-18 06:47:59.81247
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.roles (id, name, description, is_system, active, created_at, updated_at) FROM stdin;
1	Administrador	Acceso total al sistema	t	t	2026-03-18 06:47:59.799039	2026-03-18 06:47:59.799039
\.


--
-- Data for Name: smtp_settings; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.smtp_settings (id, host, port, username, password_encrypted, from_email, from_name, use_tls, use_ssl, timeout_seconds, enabled, updated_at, updated_by) FROM stdin;
\.


--
-- Data for Name: tipos_identificacion; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.tipos_identificacion (id, codigo, nombre, activo, created_at, updated_at) FROM stdin;
1	CC	Cédula de ciudadanía	t	2026-03-18 06:47:59.783489	2026-03-18 06:47:59.783489
2	TI	Tarjeta de identidad	t	2026-03-18 06:47:59.783489	2026-03-18 06:47:59.783489
3	CE	Cédula de extranjería	t	2026-03-18 06:47:59.783489	2026-03-18 06:47:59.783489
4	PA	Pasaporte	t	2026-03-18 06:47:59.783489	2026-03-18 06:47:59.783489
5	RC	Registro civil	t	2026-03-18 06:47:59.783489	2026-03-18 06:47:59.783489
6	MS	Menor sin identificación	t	2026-03-18 06:47:59.783489	2026-03-18 06:47:59.783489
\.


--
-- Data for Name: tipos_pbs; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.tipos_pbs (id, codigo, nombre, activo, created_at, updated_at) FROM stdin;
1	CONT	Contributivo	t	2026-03-18 06:47:59.796684	2026-03-18 06:47:59.796684
2	SUB	Subsidiado	t	2026-03-18 06:47:59.796684	2026-03-18 06:47:59.796684
3	PART	Particular	t	2026-03-18 06:47:59.796684	2026-03-18 06:47:59.796684
\.


--
-- Data for Name: tipos_servicio; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.tipos_servicio (id, codigo, nombre, activo, created_at, updated_at) FROM stdin;
1	PBS	Plan de Beneficios de Salud	t	2026-03-18 06:47:59.791813	2026-03-18 06:47:59.791813
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: admiSim
--

COPY public.usuarios (id, username, password_hash, rol, activo, creado_en, role_id) FROM stdin;
1	admin	$2b$12$MCO25d3w4w6Io95hReL.AO0SrgB.z55TAwA8tprTaNfdAje4PqHEq	ADMIN	t	2026-03-18 06:47:59.807949	1
\.


--
-- Name: actions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.actions_id_seq', 4, true);


--
-- Name: alertas_paciente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.alertas_paciente_id_seq', 1, false);


--
-- Name: anamnesis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.anamnesis_id_seq', 1, false);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- Name: chat_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.chat_notifications_id_seq', 1, false);


--
-- Name: chat_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.chat_sessions_id_seq', 1, false);


--
-- Name: citas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.citas_id_seq', 1, false);


--
-- Name: ciudades_residencia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.ciudades_residencia_id_seq', 8, true);


--
-- Name: disponibilidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.disponibilidades_id_seq', 1, false);


--
-- Name: especialidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.especialidades_id_seq', 2, true);


--
-- Name: festivos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.festivos_id_seq', 1, false);


--
-- Name: pacientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.pacientes_id_seq', 1, false);


--
-- Name: permission_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.permission_groups_id_seq', 18, true);


--
-- Name: prenombres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.prenombres_id_seq', 4, true);


--
-- Name: profesionales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.profesionales_id_seq', 1, false);


--
-- Name: rangos_bloqueados_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.rangos_bloqueados_id_seq', 1, false);


--
-- Name: role_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.role_permissions_id_seq', 72, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, true);


--
-- Name: smtp_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.smtp_settings_id_seq', 1, false);


--
-- Name: tipos_identificacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.tipos_identificacion_id_seq', 6, true);


--
-- Name: tipos_pbs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.tipos_pbs_id_seq', 3, true);


--
-- Name: tipos_servicio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.tipos_servicio_id_seq', 1, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: admiSim
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 1, true);


--
-- Name: actions actions_code_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_code_key UNIQUE (code);


--
-- Name: actions actions_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.actions
    ADD CONSTRAINT actions_pkey PRIMARY KEY (id);


--
-- Name: alertas_paciente alertas_paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.alertas_paciente
    ADD CONSTRAINT alertas_paciente_pkey PRIMARY KEY (id);


--
-- Name: anamnesis anamnesis_paciente_id_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.anamnesis
    ADD CONSTRAINT anamnesis_paciente_id_key UNIQUE (paciente_id);


--
-- Name: anamnesis anamnesis_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.anamnesis
    ADD CONSTRAINT anamnesis_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_notifications chat_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.chat_notifications
    ADD CONSTRAINT chat_notifications_pkey PRIMARY KEY (id);


--
-- Name: chat_sessions chat_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);


--
-- Name: citas citas_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_pkey PRIMARY KEY (id);


--
-- Name: ciudades_residencia ciudades_residencia_nombre_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.ciudades_residencia
    ADD CONSTRAINT ciudades_residencia_nombre_key UNIQUE (nombre);


--
-- Name: ciudades_residencia ciudades_residencia_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.ciudades_residencia
    ADD CONSTRAINT ciudades_residencia_pkey PRIMARY KEY (id);


--
-- Name: disponibilidades disponibilidades_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.disponibilidades
    ADD CONSTRAINT disponibilidades_pkey PRIMARY KEY (id);


--
-- Name: especialidades especialidades_codigo_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_codigo_key UNIQUE (codigo);


--
-- Name: especialidades especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_pkey PRIMARY KEY (id);


--
-- Name: festivos festivos_fecha_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.festivos
    ADD CONSTRAINT festivos_fecha_key UNIQUE (fecha);


--
-- Name: festivos festivos_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.festivos
    ADD CONSTRAINT festivos_pkey PRIMARY KEY (id);


--
-- Name: pacientes pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_pkey PRIMARY KEY (id);


--
-- Name: pacientes pacientes_tipo_identificacion_numero_identificacion_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_tipo_identificacion_numero_identificacion_key UNIQUE (tipo_identificacion, numero_identificacion);


--
-- Name: permission_groups permission_groups_code_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.permission_groups
    ADD CONSTRAINT permission_groups_code_key UNIQUE (code);


--
-- Name: permission_groups permission_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.permission_groups
    ADD CONSTRAINT permission_groups_pkey PRIMARY KEY (id);


--
-- Name: prenombres prenombres_nombre_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.prenombres
    ADD CONSTRAINT prenombres_nombre_key UNIQUE (nombre);


--
-- Name: prenombres prenombres_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.prenombres
    ADD CONSTRAINT prenombres_pkey PRIMARY KEY (id);


--
-- Name: profesional_especialidades_secundarias profesional_especialidades_secundarias_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.profesional_especialidades_secundarias
    ADD CONSTRAINT profesional_especialidades_secundarias_pkey PRIMARY KEY (profesional_id, especialidad_id);


--
-- Name: profesionales profesionales_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_pkey PRIMARY KEY (id);


--
-- Name: rangos_bloqueados rangos_bloqueados_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.rangos_bloqueados
    ADD CONSTRAINT rangos_bloqueados_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_id_permission_group_id_action_id_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_permission_group_id_action_id_key UNIQUE (role_id, permission_group_id, action_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: smtp_settings smtp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.smtp_settings
    ADD CONSTRAINT smtp_settings_pkey PRIMARY KEY (id);


--
-- Name: tipos_identificacion tipos_identificacion_codigo_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.tipos_identificacion
    ADD CONSTRAINT tipos_identificacion_codigo_key UNIQUE (codigo);


--
-- Name: tipos_identificacion tipos_identificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.tipos_identificacion
    ADD CONSTRAINT tipos_identificacion_pkey PRIMARY KEY (id);


--
-- Name: tipos_pbs tipos_pbs_codigo_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.tipos_pbs
    ADD CONSTRAINT tipos_pbs_codigo_key UNIQUE (codigo);


--
-- Name: tipos_pbs tipos_pbs_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.tipos_pbs
    ADD CONSTRAINT tipos_pbs_pkey PRIMARY KEY (id);


--
-- Name: tipos_servicio tipos_servicio_codigo_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.tipos_servicio
    ADD CONSTRAINT tipos_servicio_codigo_key UNIQUE (codigo);


--
-- Name: tipos_servicio tipos_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.tipos_servicio
    ADD CONSTRAINT tipos_servicio_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: idx_anamnesis_paciente_id; Type: INDEX; Schema: public; Owner: admiSim
--

CREATE INDEX idx_anamnesis_paciente_id ON public.anamnesis USING btree (paciente_id);


--
-- Name: idx_chat_messages_session_id; Type: INDEX; Schema: public; Owner: admiSim
--

CREATE INDEX idx_chat_messages_session_id ON public.chat_messages USING btree (session_id);


--
-- Name: idx_chat_notifications_is_read; Type: INDEX; Schema: public; Owner: admiSim
--

CREATE INDEX idx_chat_notifications_is_read ON public.chat_notifications USING btree (is_read);


--
-- Name: idx_chat_sessions_patient_id; Type: INDEX; Schema: public; Owner: admiSim
--

CREATE INDEX idx_chat_sessions_patient_id ON public.chat_sessions USING btree (patient_id);


--
-- Name: idx_chat_sessions_status; Type: INDEX; Schema: public; Owner: admiSim
--

CREATE INDEX idx_chat_sessions_status ON public.chat_sessions USING btree (status);


--
-- Name: idx_citas_fecha; Type: INDEX; Schema: public; Owner: admiSim
--

CREATE INDEX idx_citas_fecha ON public.citas USING btree (fecha_programacion);


--
-- Name: idx_dispo_profesional; Type: INDEX; Schema: public; Owner: admiSim
--

CREATE INDEX idx_dispo_profesional ON public.disponibilidades USING btree (profesional_id);


--
-- Name: idx_pacientes_doc; Type: INDEX; Schema: public; Owner: admiSim
--

CREATE INDEX idx_pacientes_doc ON public.pacientes USING btree (numero_identificacion);


--
-- Name: idx_usuarios_role_id; Type: INDEX; Schema: public; Owner: admiSim
--

CREATE INDEX idx_usuarios_role_id ON public.usuarios USING btree (role_id);


--
-- Name: alertas_paciente alertas_paciente_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.alertas_paciente
    ADD CONSTRAINT alertas_paciente_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.usuarios(id);


--
-- Name: alertas_paciente alertas_paciente_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.alertas_paciente
    ADD CONSTRAINT alertas_paciente_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;


--
-- Name: anamnesis anamnesis_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.anamnesis
    ADD CONSTRAINT anamnesis_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id);


--
-- Name: chat_notifications chat_notifications_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.chat_notifications
    ADD CONSTRAINT chat_notifications_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id);


--
-- Name: chat_sessions chat_sessions_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.pacientes(id);


--
-- Name: citas citas_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);


--
-- Name: citas citas_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.citas
    ADD CONSTRAINT citas_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesionales(id);


--
-- Name: disponibilidades disponibilidades_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.disponibilidades
    ADD CONSTRAINT disponibilidades_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesionales(id);


--
-- Name: profesional_especialidades_secundarias profesional_especialidades_secundarias_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.profesional_especialidades_secundarias
    ADD CONSTRAINT profesional_especialidades_secundarias_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES public.especialidades(id) ON DELETE CASCADE;


--
-- Name: profesional_especialidades_secundarias profesional_especialidades_secundarias_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.profesional_especialidades_secundarias
    ADD CONSTRAINT profesional_especialidades_secundarias_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesionales(id) ON DELETE CASCADE;


--
-- Name: profesionales profesionales_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES public.especialidades(id);


--
-- Name: profesionales profesionales_prenombre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.profesionales
    ADD CONSTRAINT profesionales_prenombre_id_fkey FOREIGN KEY (prenombre_id) REFERENCES public.prenombres(id);


--
-- Name: rangos_bloqueados rangos_bloqueados_profesional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.rangos_bloqueados
    ADD CONSTRAINT rangos_bloqueados_profesional_id_fkey FOREIGN KEY (profesional_id) REFERENCES public.profesionales(id);


--
-- Name: role_permissions role_permissions_action_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_action_id_fkey FOREIGN KEY (action_id) REFERENCES public.actions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_permission_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_group_id_fkey FOREIGN KEY (permission_group_id) REFERENCES public.permission_groups(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: usuarios usuarios_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admiSim
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: admiSim
--

ALTER DEFAULT PRIVILEGES FOR ROLE "admiSim" IN SCHEMA public GRANT ALL ON SEQUENCES  TO "admiSim";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: admiSim
--

ALTER DEFAULT PRIVILEGES FOR ROLE "admiSim" IN SCHEMA public GRANT ALL ON TABLES  TO "admiSim";


--
-- PostgreSQL database dump complete
--

\unrestrict TcaSJlJlWNXjDT3cKgAW7b5QOwgYfRqS6SVAZeG6kOj64IYtUP23dCMVVBgKuTq

